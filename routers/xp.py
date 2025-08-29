from fastapi import APIRouter, Depends
from fastapi import Request
from sqlalchemy.orm import Session

from db import get_session
from routers.challenges import get_users_challenges_xp
from routers.tasks import get_users_tasks

router = APIRouter()

@router.get("/get_xp")
def get_tasks_xp(
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = int(getattr(request.state, "user_id", None))  # set by middleware after JWT checks
    total_xp = get_users_tasks(db, user_id) * 10
    total_xp += get_users_challenges_xp(db, user_id)

    return {"user_id": user_id, "total_xp": int(total_xp)}