# 🗄️ Database Schema & Data Dictionary

The system uses a relational model optimized for time-series presence data.

## 1. Entity Relationship Summary

- **Users**: Core entity. Belongs to a **Department**.
- **Departments**: Groups users. Has a **Webhook** and a **Default Category**.
- **Categories**: Lookup table for presence types (icons, colors, names).
- **Presences**: Join table linking a **User** to a **Category** on a specific **Date**.
- **Holidays**: Simple list of dates that override normal workday logic.

---

## 2. Table Definitions

### `users`
| Column | Type | Description |
|---|---|---|
| `id_user` | SERIAL | Primary Key. |
| `email` | VARCHAR | Unique. Used for login. |
| `password` | TEXT | Bcrypt hashed string. |
| `role` | VARCHAR | `user`, `admin`, or `superadmin`. |
| `calendar_token` | UUID | Unique token for iCal export. |

### `presences`
| Column | Type | Description |
|---|---|---|
| `id_presence` | SERIAL | Primary Key. |
| `id_user` | INT | Foreign Key to `users`. |
| `date` | DATE | The specific day. Unique per user. |
| `id_category` | INT | Foreign Key to `categories`. |

---

## 3. Key Queries & Logic
- **Presence Resolution**: A complex JOIN query handles the inheritance from Department defaults to ensure "Ghost Icons" work even if the database is empty for a specific day.
- **Cleanup**: (Recommended) Periodically archive entries older than 2 years to maintain index performance.
