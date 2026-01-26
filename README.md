## Budget Bites 

A small web app for managing monthly groceries to reduce food waste:
- **Inventory (Vorrat/Dispensa)**: track what you have and optional shelf life
- **Shopping list**: track what you need to buy
- **Meal Planner**: “smart suggestions” based on your items (rule-based demo)
- **Dashboard**: shows active stock + historical waste count

## Features
- Multi-language UI (EN / DE / IT)
- Cloud sync with Firebase (anonymous login)
- Expired items are automatically counted as waste

 ## Tech
- HTML + TailwindCSS
- Vanilla JavaScript (ES Modules)
- Firebase Auth + Firestore

  
## Notes / Limitations
- Recommendation logic is rule-based (no external AI API key in frontend)
- Data is stored per anonymous user id
