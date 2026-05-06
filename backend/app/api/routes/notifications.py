from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationRead

router = APIRouter()


@router.get("/notifications", response_model=list[NotificationRead])
def list_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Notification]:
    return list(
        db.scalars(
            select(Notification)
            .where(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .limit(100)
        ).all()
    )


@router.patch("/notifications/{notification_id}/read", response_model=NotificationRead)
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Notification:
    notification = db.scalar(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    if not notification:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.patch("/notifications/read-all", status_code=204)
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    notifications = db.scalars(select(Notification).where(Notification.user_id == current_user.id)).all()
    for notification in notifications:
        notification.is_read = True
    db.commit()
    return Response(status_code=204)
