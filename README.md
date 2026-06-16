# A Project Manager Application

A modern, kanban project managemwnt system built to handle team collaboration, task tracking

This application features stateless JWT authentication, Role-based Access Control

##Tech Stack
Frontend: React(Typescript), Vite, Tailwind Css, Axios
Backend: FastAPI, SQLModel
Database: SQLite
For security: bcrypt for password hashing, PyJWT for stateless session management

## Core features
Secure authetication: User registration and login with encrypted passwords and JWT
Workspace management: users can create isolated project workspaces
role-based access control: Admins can invite other registered users to workspace as members, viewers, strictly controlling who can modify tasks
An interactive Kanban board: Reael time task tracking accross "To-Do", "In progress", and "Done" states

## setup instructions

To test the application locally, you would need two windows running simultaneously(one for the frontend and one for the backend)

## Prerequesites
-Python 3.8 installed
-Node js and npm installed 

### Step 1:start the backend
1. open the terminal and clone the repository
2. Navgate to the root directory of the project
3. Create and activate a python virtual environment:
  in bash
  #for windows
  python -m venv .venv
  .venv\Scripts\activate

  #for mac/linux
  python3 -m venv .venv
  source .venv/bin/activate

4. Intstall the reqired python dependencies: pip install -r requirements.txt
5. start the fastAPI server: uvicorn main:app --reload

Step 2:
1. open a second terminal
2. navigate into the frontend directory: cd frontend
3. npm install
4. To run the npx server: npx vite
