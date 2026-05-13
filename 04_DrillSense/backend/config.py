"""
H&P DrillSense -- Konfiguration
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    RIG_ID: str = "247"
    ENABLE_SIMULATOR: bool = True
    DRILLSENSE_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
