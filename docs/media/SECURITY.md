# 🔐 Security, Authentication & Permissions

## 1. Authentication Flow
FAE Calendar uses a stateless **JWT (JSON Web Token)** strategy.

1. **Login**: User posts credentials to `/api/login`.
2. **Validation**: Backend checks Bcrypt hash against the database.
3. **Issuance**: A JWT is signed with `JWT_SECRET` containing the `id_user`, `role`, and `department`.
4. **Storage**: The token is stored in the browser's `localStorage`.
5. **Request**: Every subsequent API call includes the token in the `Authorization: Bearer <token>` header.

---

## 2. Authorization Levels (RBAC)

- **`user`**:
    - Can view the full calendar.
    - Can only edit their **own** presences.
    - Can edit their own profile settings.
- **`admin`**:
    - All `user` permissions.
    - Can manage users **within their own department**.
    - Can view department-specific reports.
- **`superadmin`**:
    - Total system control.
    - Can manage all users across all departments.
    - Can edit Categories, Departments, and Global Holidays.

---

## 3. Network Security
- **CORS**: Restricts API access to the specific domain configured in `CORS_ORIGIN`.
- **Payload Limits**: Express JSON parser is limited to `5mb` to prevent memory exhaustion attacks.
- **Environment Isolation**: Secrets like `JWT_SECRET` and `DATABASE_URL` are never committed to version control.
