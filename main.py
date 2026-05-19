from pydantic import BaseModel
from models import engine, User, Project, ProjectMember, Task, create_db_and_tables
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlmodel import Session, select
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.middleware.cors import CORSMiddleware

app =FastAPI(title="Internal Project Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Importing the database blue prints
#we bring in the database connection and the table structures
from models import engine, User, create_db_and_tables

# Password hasher
# we tell passlib to use the bcrypt algorithm. This takes the password like "pass123"
# and turns it into a mathematical scramble that cannot be reversed
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
# SECRET_KEY is the master password of the server. The server uses this to digitally
# sign the tokens. If a hacker tries to make a fake token, it won't have this signature
SECRET_KEY = "ikeja-secret-key"
ALGORITHM = "HS256" #the mathematical algorithm used to sign the token
ACCESS_TOKEN_EXPIRE_MINUTES = 30 #tokens self destruct after 30 minutes for security

# The gate keeper
# this tells fast api where users should go to get their tokens
# It automatically adds the authorize padlock button to our swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


#Token factory
# this function actually builds the vip wristband
def create_access_token(data: dict):
    to_encode = data.copy() #makes a copy of the data
    # calculates exactly what time it will be 30 minutes from right now
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # mathematically lock and sign the token using the server's SECRET_KEY 
    encode_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encode_jwt

# Boot up script
# The moment the server turns on, it looks at models.py and builds the blank SQLite tables
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# The Database doorman
# Every time a user makes a request, this function opens a temporary doorway
# to the SQLite database, let the request do it's work and safely closes the door  
def get_session():
    with Session(engine) as session:
        yield session

# ---  IDENTITY & ACCESS MANAGEMENT ---
class UserCreate(BaseModel):
    username: str
    password: str

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, session: Session = Depends(get_session)):
    
    # Use user.username and user.password instead!
    statement = select(User).where(User.username == user.username)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_pwd = pwd_context.hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_pwd)
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return {"message": f"User {user.username} created successfully!", "user_id": new_user.id}

@app.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    # find the user trying to log in
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()

    #verify if the user doesn't exist, or if the password typed does not
    # match the scarmbled password in the database, kick them out
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"www-Authentication": "Bearer"},
        )

    #if everthing is correct, hand them a 30 minutes vip token
    access_token = create_access_token(data={"sub": user.username})

    # the api returns it exactly how the frontend expects it
    return {"access_token": access_token, "token_type": "bearer"}
    
    
#The bouncer( security middleware)
#this function sits in front of the protected routes. It forces users to show a token
def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    print("\n--- BOUNCER SECURITY CHECK ---")
    print(f"1. Token presented: {token[:15]}... (truncated)") 
    
    try:
        # Try to decode the token. This will automatically fail if the token was tampered with
        #or if the 30 minutes timer ran out
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"2. Token successfully decoded! Payload: {payload}")
        
        #pull the username ("sub") out of the token's data
        username: str = payload.get("sub")
        if username is None:
            print("3. FAILED: No username found inside the token.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: No username")
            
    except jwt.ExpiredSignatureError:
        print("3. FAILED: The token's time limit expired.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError as e:
        print(f"3. FAILED: PyJWT could not read the token. Reason: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token structure")
    
    # just because the token is valid doesn't mean the user wasn't deleted from the system 5 mins ago
    # we must double check the database to make sure the user still exists
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        print("4. FAILED: Token is valid, but user no longer exists in database.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # if they pass all texts, return their entire database file to the route
    print(f"5. SUCCESS: User '{user.username}' verified. Opening VIP doors.")
    return user

#The VIP room
# notice "depends(get_current_user)"? That puts the bouncer(middleware) at the front door
#if you don't have a token, this code will never even excute
@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "message": "Welcome to the VIP area!", 
        "user_details": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role
        }
    }

# --- Work space module --- 
class ProjectCreate(BaseModel):
    name: str
    description: str = None
@app.post("/projects", status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user) #bouncer(middleware)
):
    # create the new project using the data the user typed in(name, description)
    # for the owner_id we secretly pull the exact ID from the verified token
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id
    )

    #save the new workspace into the SQLite database
    session.add(new_project)
    session.commit()
    session.refresh(new_project)

    vip_entry = ProjectMember(
        user_id=current_user.id,
        project_id=new_project.id,
        role="Admin"
    )
    session.add(vip_entry)
    session.commit()

    return {
        "message": f"Project '{new_project.name}' created and Admin access granted.", 
        "project": new_project
    }

@app.get("/projects")
def get_user_project(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user) #bouncer(middleware) is checking the wristband(auhorization)
):
    
    #ask the database to select al projects
    # where the project's owner_id exactly matches our verified user's ID
    statement = select(Project).where(Project.owner_id == current_user.id)

    #fetch all matching results as a list
    user_projects = session.exec(statement).all()

    #return the list to the frontend
    return {
        "message": f"Found {len(user_projects)} workspaces for {current_user.username}",
        "projects": user_projects
    }

@app.put("/projects/{project_id}")
def update_project(
    project_id: int,
    name: str = None,
    description: str = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    #find the specific project in  the database
    statement = select(Project).where(Project.id == project_id)
    project = session.exec(statement).first()

    #does the project even exist?
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="projectnot found")
    
    #ownership check: is the person trying to update it the actual owner
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="you do not have permission to edit this project")
    
    #if they pass the checks, update the fields they provided
    if name:
        project.name = name
    if description:
        project.description = description

    #save the changes
    session.add(project)
    session.commit()
    session.refresh(project)

    return {"message": "Project updated successfully", "project": project}

@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    #find the project to be deleted
    statement = select(Project).where(Project.id == project_id)
    project = session.exec(statement).first()

    #check if it exist
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, details="Project not found")
    
    #ownership check: is the person trying to update it the actual owner
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="you do not have permission to edit this project")
    
    #destroy the record
    session.delete(project)
    session.commit()

    # 204 NO CONTENT doesn't return a JSON body, it just returns a strict success signal to the frontend
    return


@app.post("/tasks", status_code=status.HTTP_201_CREATED)
def create_task(
    title: str,
    project_id: int, #to know which project the task belongs to
    description: str = None,
    task_status: str = "To-Do", #Renamed slightly to avoid python keyword conflicts
    priority: str = "Medium",
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user) #the bouncer
):
    statement = select(Project).where(Project.id == project_id)
    project = session.exec(statement).first()

    # a check if the project exists
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    #ownership check if the project belongs to the logged in user
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to add tasks to this workspace")
    
    #task creation
    new_task = Task(
        title=title,
        description=description,
        status=task_status,
        priority=priority,
        project_id=project_id,
        assignee_id=current_user.id
    )

    #save to the database
    session.add(new_task)
    session.commit()
    session.refresh(new_task)

    return{"message": f"Tasks '{new_task.title}' added to project successfully", "task": new_task}

@app.get("/projects/{project_id}/tasks")
def get_project_tasks(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user) 
):
    project = session.exec(select(Project).where(Project.id == project_id)).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
   #VIP check if the user is on the list of the specific project
    statement = select(ProjectMember).where(
       ProjectMember.project_id == project_id,
       ProjectMember.user_id == current_user.id
   )
    vip_pass = session.exec(statement).first()

    if not vip_pass:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this workspace")
    
    #if the are on the list, fetch the tasks
    task_statement = select(Task).where(Task.project_id == project_id)
    tasks = session.exec(task_statement).all()

    return {"Message": "Tasks retrieved successfully", "tasks": tasks}

@app.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    title: str = None,
    task_status: str = None,
    priority: str = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    task = session.exec(select(Task).where(Task.id == task_id)).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    #vip check if they are on the list for the project this task belongs to
    statement = select(ProjectMember).where(
        ProjectMember.project_id == task.project_id,
        ProjectMember.user_id == current_user.id
    )
    vip_pass = session.exec(statement).first()

    if not vip_pass:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this workspace"
        )
    
    #update the fields if the user provided them
    if title:
        task.title = title
    if task_status:
        task.status = task_status
    if priority:
        task.priority = priority

    #save the changes to the database
    session.add(task)
    session.commit()
    session.refresh(task)

    return {"message": "Task updated successfully", "task": task}

@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
        task_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
    ):
        task = session.exec(select(Task).where(Task.id == task_id)).first()
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
        # vip  check
        statement = select(ProjectMember).where(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == current_user.id
        )
        vip_pass = session.exec(statement).first()

        if not vip_pass:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this workspace")
        # role check
        if vip_pass.role == "Viewer":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers are not allowed to delete tasks")
        session.delete(task)
        session.commit()

        #204 commit means the server successfully processed the request,
        #but there is no JSON data to return. It just silently succeeds
        return 

@app.post("/projects/{project_id}/members")
def invite_user_to_project(
    project_id: int,
    invitee_username: str,
    role: str = "Viewer",
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user) #the bouncer
):
    #a check if the project exists
    project = session.exec(select(Project).where(Project.id == project_id)).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    #the admin check if the person sending the invite is actually an admin
    current_user_link = session.exec(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    ).first()

    if not current_user_link or current_user_link.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can invite new members to this workspace"
        )
    
    # check for if the person exists in the database
    invitee = session.exec(select(User).where(User.username == invitee_username)).first()
    if not invitee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    existing_link = session.exec(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == invitee.id
        )
    ).first()

    if existing_link:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already in this project")

    #success add the user to the vip list
    new_member = ProjectMember(
        user_id=invitee.id,
        project_id=project_id,
        role=role
    )
    session.add(new_member)
    session.commit()

    return {"message": f"Successfully added {invitee.username} to the project as a {role}"}