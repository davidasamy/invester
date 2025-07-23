#!/bin/bash
cd starter-frontend && npm start &
cd starter-backend && uvicorn main:app --reload