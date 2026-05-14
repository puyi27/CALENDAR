import fetch from 'node-fetch';
import { config } from '../config';
import { query, pool } from '../db/pool';

export async function transmitTeamsNotification(cardBodyElements: any[], webhookUrl: string): Promise<void> {
  if (!webhookUrl || webhookUrl.trim() === '') {
    return;
  }

  try {
    const payload = {
      type: "message",
      attachments: [{
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          type: "AdaptiveCard",
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          version: "1.2",
          msteams: { width: "Full" },
          body: cardBodyElements,
          actions: [
            {
              type: "Action.OpenUrl",
              title: "📅 Open Calendar",
              url: config.FRONTEND_URL
            }
          ]
        },
      }],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Teams Webhook Error:", error);
  }
}

export async function executeDailyTeamsNotifications() {
  const currentDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const databaseDateString = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(nextDate);

  const displayDateString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome', weekday: 'long', day: 'numeric', month: 'long'
  }).format(nextDate);

  try {
    const { rows: userRecords } = await pool.query(
      `SELECT u.full_name, u.department,
              p.id_category as presence_cat_id,
              pc.name as presence_cat_name, pc.icon as presence_icon, pc.name_en as presence_name_en,
              COALESCE(u.default_category_id, d.default_category_id) as resolved_def_cat_id,
              dc.name as def_cat_name, dc.icon as def_icon, dc.name_en as def_name_en
       FROM users u
       LEFT JOIN departments d ON u.department = d.name
       LEFT JOIN presences p ON u.id_user = p.id_user AND p.date::DATE = $1::DATE
       LEFT JOIN categories pc ON p.id_category = pc.id_category
       LEFT JOIN categories dc ON dc.id_category = COALESCE(u.default_category_id, d.default_category_id)`,
      [databaseDateString]
    );

    const consolidatedUsers = userRecords.map(u => {
       const computedCategoryId = u.presence_cat_id || u.resolved_def_cat_id;
       const computedCategoryName = u.presence_cat_id ? (u.presence_name_en || u.presence_cat_name) : (u.def_name_en || u.def_cat_name);
       const computedIcon = u.presence_cat_id ? u.presence_icon : u.def_icon;
       return { ...u, computedCategoryId, computedCategoryName, computedIcon };
    });

    const { rows: departmentRecords } = await pool.query('SELECT d.name, d.webhook_url, d.default_category_id FROM departments d');

    for (const department of departmentRecords) {
      if (!department.webhook_url) continue;

      const currentDepartmentName = department.name;
      const departmentDefaultCategoryId = department.default_category_id;
      const destinationWebhook = department.webhook_url;

      const nativeEmployees = consolidatedUsers.filter(u => u.department === currentDepartmentName);
      const visitingEmployees = consolidatedUsers.filter(u => u.department !== currentDepartmentName && u.computedCategoryId === departmentDefaultCategoryId && departmentDefaultCategoryId !== null);

      const presentInOffice: string[] = [];
      const externalLocationsMap: Record<string, string[]> = {};
      const pendingConfirmation: string[] = [];

      for (const employee of nativeEmployees) {
        if (employee.computedCategoryId) {
          if (departmentDefaultCategoryId && employee.computedCategoryId === departmentDefaultCategoryId) {
            presentInOffice.push(employee.full_name);
          } else {
            let contextIcon = "🏢";
            if (employee.computedIcon === 'Home') contextIcon = "🏠";
            if (employee.computedIcon === 'BeachAccess') contextIcon = "⛱️";
            if (employee.computedIcon === 'Sick') contextIcon = "🤒";
            if (employee.computedIcon === 'Work') contextIcon = "💼";

            const groupIdentifier = `${contextIcon} ${employee.computedCategoryName}`;
            if (!externalLocationsMap[groupIdentifier]) externalLocationsMap[groupIdentifier] = [];
            externalLocationsMap[groupIdentifier].push(employee.full_name);
          }
        } else {
          pendingConfirmation.push(employee.full_name);
        }
      }

      let cardBodyElements: any[] = [
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              width: "stretch",
              items: [
                {
                  type: "TextBlock",
                  text: `📊 PRESENCE STATUS: ${String(currentDepartmentName).toUpperCase()}`,
                  weight: "Bolder",
                  size: "ExtraLarge",
                  color: "Accent",
                  wrap: true
                },
                {
                  type: "TextBlock",
                  text: `🗓️ Date: **${displayDateString.charAt(0).toUpperCase() + displayDateString.slice(1)}**`,
                  isSubtle: true,
                  size: "Medium",
                  spacing: "Small"
                }
              ]
            }
          ]
        }
      ];

      let isFirstSection = true;

      if (departmentDefaultCategoryId && presentInOffice.length > 0) {
        cardBodyElements.push({
          type: "Container",
          spacing: "Large",
          separator: !isFirstSection,
          items: [
            { type: "TextBlock", text: "🏢 IN OFFICE", color: "Good", weight: "Bolder", size: "Large", spacing: "Small" },
            { type: "TextBlock", text: presentInOffice.map(e => `* 👤 **${e}**`).join('\n'), wrap: true, spacing: "Small" }
          ]
        });
        isFirstSection = false;
      }

      if (visitingEmployees.length > 0) {
        cardBodyElements.push({
          type: "Container",
          spacing: "Large",
          separator: !isFirstSection,
          items: [
            { type: "TextBlock", text: "🌟 GUESTS IN HQ", color: "Accent", weight: "Bolder", size: "Large", spacing: "Small" },
            { type: "TextBlock", text: visitingEmployees.map(e => `* 👤 **${e.full_name}** _(${e.department})_`).join('\n'), wrap: true, spacing: "Small" }
          ]
        });
        isFirstSection = false;
      }

      for (const [locationKey, assignedEmployees] of Object.entries(externalLocationsMap)) {
        cardBodyElements.push({
          type: "Container",
          spacing: "Large",
          separator: !isFirstSection,
          items: [
            { type: "TextBlock", text: locationKey.toUpperCase(), color: "Warning", weight: "Bolder", size: "Large", spacing: "Small" },
            { type: "TextBlock", text: assignedEmployees.map(e => `* 👤 **${e}**`).join('\n'), wrap: true, spacing: "Small" }
          ]
        });
        isFirstSection = false;
      }

      if (pendingConfirmation.length > 0) {
        cardBodyElements.push({
          type: "Container",
          spacing: "Large",
          separator: !isFirstSection,
          items: [
            { type: "TextBlock", text: "⚠️ UNCONFIRMED", color: "Attention", weight: "Bolder", size: "Large", spacing: "Small" },
            { type: "TextBlock", text: pendingConfirmation.map(e => `* 👤 **${e}**`).join('\n'), wrap: true, spacing: "Small" }
          ]
        });
        isFirstSection = false;
      }

      cardBodyElements.push({
        type: "Container",
        spacing: "ExtraLarge",
        separator: true,
        items: [
          {
            type: "TextBlock",
            text: "💡 *If you don't specify a location, the system assumes you are at your default base.*",
            isSubtle: true,
            size: "Small",
            wrap: true,
            spacing: "Small"
          }
        ]
      });

      if (config.ENABLE_TEAMS_WEBHOOKS) {
        await transmitTeamsNotification(cardBodyElements, destinationWebhook);
      } else {
        console.log(`Teams notification skipped for ${currentDepartmentName} (Feature disabled)`);
      }
    }
  } catch (error) {
    console.error("Cron Error:", error);
  }
}
