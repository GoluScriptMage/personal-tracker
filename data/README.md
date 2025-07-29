# Seed Data for Personal Tracker

This folder contains seed data for the Personal Tracker application.

## Files

- `seedData.js`: JavaScript file to import seed data directly into MongoDB
- `seedData.json`: JSON file containing the seed data structure (for reference)

## Data Overview

- 3 sample users
- 20 sample expenses distributed among these users:
  - User 1 (John Doe): 8 expenses
  - User 2 (Jane Smith): 7 expenses
  - User 3 (Mike Wilson): 5 expenses

## How to Use

### Option 1: Import using the script

Run the following command from the project root:

```bash
npm run seed
```

This will:

1. Connect to your MongoDB database
2. Clear existing users and expenses
3. Create 3 new users
4. Create 20 new expenses linked to these users

### Option 2: Use the JSON data manually

The `seedData.json` file contains the same data in JSON format if you prefer to:

- Use it as a reference
- Import it using a different method
- Modify it before importing

Note: In the JSON file, user IDs are represented as placeholders ("USER_ID_1", etc.)
that would need to be replaced with actual MongoDB ObjectIDs when used.
