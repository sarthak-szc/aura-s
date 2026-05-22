from datetime import datetime, timezone
from typing import Any

from database import db


async def log_audit(
    action: str,
    user_id: str | None = None,
    user_email: str | None = None,
    resource: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    await db.audit_logs.insert_one({
        "action": action,
        "user_id": user_id,
        "user_email": user_email,
        "resource": resource,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
