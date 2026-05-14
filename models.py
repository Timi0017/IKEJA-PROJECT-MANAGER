from sqlmodel import SQLModel, Field, create_engine
from typing import Optional

# the user blueprint
# by inheriting from "SQLmodel, table=True" we tell the computer:
# turn this python class into an actual SQL database table
class User(SQLModel, table=True):
    # 'id' is the primary key. It automatically counts up for every new user
    id: Optional[int] = Field(default=None, primary_key=True)

    # The username must be unique. No two people can be named the same thing
    username: str = Field(unique=True, index=True)

    # we store the scrambled password, Never the real one
    hashed_password: str

    #Role-based Access control, Default is user
    role: str = Field(default="user")  # Can be 'user' or 'admin'

# 2. The Project Table (Workspaces)
class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    owner_id: int = Field(foreign_key="user.id")  # Links the project to the user who created it

# 3. The Task Table (The Kanban Engine)
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    status: str = Field(default="To-Do")  # To-Do, In Progress, Done
    priority: str = Field(default="Medium")  # Low, Medium, High
    
    project_id: int = Field(foreign_key="project.id")  # Links the task to a specific project
    assignee_id: Optional[int] = Field(default=None, foreign_key="user.id")  # Who is doing the work

class ProjectMember(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    project_id: int = Field(foreign_key="project.id")
    role: str = Field(default="Member") #roles can be admin, member or view


# Database Connection Setup. physical connection to the drive
sqlite_file_name = "project_manager.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# echo=True prints the actual SQL commands in your terminal so you can learn how it works!
engine = create_engine(sqlite_url, echo=True)

#this scans all the blueprints above and builds the actual columns in the file
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# This runs the creation function if you run this file directly
if __name__ == "__main__":
    create_db_and_tables()
    print("Enterprise Database and Tables created successfully!")