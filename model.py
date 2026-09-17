import joblib
from fastapi import FastAPI
import pandas as pd
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

model = joblib.load("mental_health_model.pkl")
top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# A first pydantic model
class StudentData(BaseModel):
    age                     : int = Field(..., ge=10, le=100, description="Age of the student (between 10 and 100)")
    gender                  : Literal['Male', 'Female']
    country                 : str
    academic_level          : Literal['High School', 'Undergraduate', 'Graduate']
    most_used_platform      : Literal['Facebook','LinkedIn','Instagram','Snapchat','Twitter','YouTube','TikTok','LINE','KakaoTalk','VKontakte','WhatsApp','WeChat'] 
    purpose_of_use          : Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_daily_usage_hours   : float = Field(..., ge=0, le=24, description="Average daily usage hours (between 6 and 24)")
    daily_unlocks           : int = Field(..., ge=0, description="Number of daily unlocks (between 0 and 100)")
    study_hours             : float = Field(..., ge=0, le=24, description="Study hours per day")
    physical_activity_hours : float = Field(..., ge=0, le=24, description="Physical activity hours per day")
    sleep_hours_per_night   : float = Field(..., ge=0, le=24, description="Sleep hours per night")
    stress_level            : Literal['Low', 'Medium', 'High', 'Very High']


# Describe what we send back to the user
class PredictionResponse(BaseModel):
    predicted_mental_health_score: float

@app.get("/")
def greet():
    return {"message": "Welcome to the Mental Health Tracker Tool!"}

@app.post("/predict", response_model=PredictionResponse)
def predict_mental_health(input_data: StudentData):
    country_group = input_data.country if input_data.country in top_countries else 'Other'

    input_row = pd.DataFrame([{
        'Age'                : input_data.age,
        'Gender'             : input_data.gender,
        'Country'            : input_data.country,
        'Academic_Level'     : input_data.academic_level,
        'Most_Used_Platform' : input_data.most_used_platform,
        'Purpose_Of_Use'     : input_data.purpose_of_use,
        'Avg_Daily_Usage_Hours' : input_data.avg_daily_usage_hours,
        'Daily_Unlocks'       : input_data.daily_unlocks,
        'Study_Hours'         : input_data.study_hours,
        'Physical_Activity_Hours' : input_data.physical_activity_hours,
        'Sleep_Hours_Per_Night'   : input_data.sleep_hours_per_night,
        'Stress_Level'            : input_data.stress_level,
        'grouped_countries'      : country_group   
    }])

    prediction = model.predict(input_row)[0]
    return PredictionResponse(predicted_mental_health_score=round(float(prediction), 2))
