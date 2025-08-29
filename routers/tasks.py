from __future__ import annotations

from datetime import datetime
from typing import List

from dateutil import parser
from fastapi import APIRouter, Depends, HTTPException
from fastapi import Request
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from db import get_session 
from models.task import Task, TaskOut

router = APIRouter()

class TaskDTO(BaseModel):
    title : str
    notes : str
    urgency : str
    dueAt : str

def get_users_tasks(db : Session,user_id : int) -> int:
    return  db.execute(
    text("SELECT challenges_schema.count_completed_tasks(:uid) AS total_xp"),
    {"uid": user_id},
).scalar_one() * 10

@router.get("/get_tasks_xp")
def get_tasks_xp(
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = int(getattr(request.state, "user_id", None))  # set by middleware after JWT checks
    total_xp = get_users_tasks(db, user_id) * 10

    return {"user_id": user_id, "total_tasks_xp": int(total_xp)}

@router.get("/get_tasks_count")
def get_tasks_xp(
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = int(getattr(request.state, "user_id", None))  # set by middleware after JWT checks
    total_xp = get_users_tasks(db, user_id)

    return {"user_id": user_id, "total_tasks": int(total_xp)}

@router.get("/get_tasks",response_model=List[TaskOut])
def get_tasks(
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = int(getattr(request.state, "user_id", None))  # set by middleware after JWT checks

    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    out: List[TaskOut] = []

    for task in tasks:
        out.append(TaskOut(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        notes=task.notes,
        urgency=task.urgency,
        dueAt=task.dueAt,
        createdAt=task.createdAt,
        completedAt=task.completedAt
            )
        )

    return out

@router.post("/create_task" , response_model=TaskOut)
def create_task(
        payload: TaskDTO,
        request: Request,
        db: Session = Depends(get_session)

):
    user_id = int(getattr(request.state, "user_id", None))  # set by middleware after JWT checks
    new_task = Task(
        user_id=user_id,
        title=payload.title,
        notes=payload.notes,
        urgency=payload.urgency,
        dueAt=payload.dueAt,
        createdAt=str(datetime.utcnow()),
    )
    db.add(new_task)

    db.commit()

    return TaskOut(
        id=new_task.id,
        user_id=new_task.user_id,
        title=new_task.title,
        notes=new_task.notes,
        urgency=new_task.urgency,
        dueAt=parser.isoparse(new_task.dueAt),
        createdAt=parser.isoparse(new_task.createdAt),
        completedAt=new_task.completedAt,
    )


@router.patch("/update_task/{task_id}",response_model=TaskOut)
def update_task(
        task_id : int,
        payload: TaskDTO,
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = int(getattr(request.state, "user_id", None))  # set by middleware after JWT checks
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="Task not allowed")

    task.title = payload.title
    task.notes = payload.notes
    task.urgency = payload.urgency
    task.dueAt = payload.dueAt

    db.commit()

    return TaskOut(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        notes=task.notes,
        urgency=task.urgency,
        dueAt=parser.isoparse(task.dueAt),
        createdAt=task.createdAt,
        completedAt=task.completedAt,
    )


@router.patch("/solve_task/{task_id}",response_model=TaskOut)
def solve_task(
        task_id : int,
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = int(getattr(request.state, "user_id", None))  # set by middleware after JWT checks

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="Task not allowed")

    task.completedAt = str(datetime.utcnow())

    return TaskOut(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        notes=task.notes,
        urgency=task.urgency,
        dueAt=task.dueAt,
        createdAt=task.createdAt,
        completedAt=task.completedAt,
    )


@router.delete("/delete_task/{task_id}")
def delete_task(
        task_id : int,
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = int(getattr(request.state, "user_id", None))  # set by middleware after JWT checks

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="Task not allowed")

    db.delete(task)
    db.commit()

    return {"deleted": True}

