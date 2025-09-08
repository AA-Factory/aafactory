from typing_extensions import Literal
import uvicorn
from time import sleep
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

class TaskRequest(BaseModel):
    payload: dict



@app.post("/run_task/")
async def run_task(request: TaskRequest) -> JSONResponse:
    sleep(60)
    return JSONResponse(content={"message": "Hello this is Sonic!"})


if __name__ == "__main__":
    uvicorn.run(app)