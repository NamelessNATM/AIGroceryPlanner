---
# City Dataset Schema

Each city is a single JSON file located at `/data/{country_code}/{city_slug}.json`.

## Top-level structure

```json
{
  "meta": { ... },
  "ingredients": [ ... ]
}
```

## meta block

| Field | Type | Description |
|-------|------|-------------|
| country | string | Full country name (e.g. "Pakistan") |
| city | string | Full city name (e.g. "Islamabad") |
| currency | string | ISO 4217 currency code (e.g. "PKR") |
| currency_symbol | string | Display symbol (e.g. "₨") |
| last_updated | string | ISO date of last price update (YYYY-MM-DD) |
| contributor | string | GitHub username of dataset author |

## ingredients array

Each item in the array:

| Field | Type | Description |
|-------|------|-------------|
| name | string | Ingredient name in English |
| category | string | One of: vegetables, fruit, meat, dairy, grains, legumes, spices, oils |
| unit | string | Pricing unit (e.g. "kg", "100g", "L", "dozen") |
| price_per_unit | number | Price in the local currency for one unit |

## Example

```json
{
  "meta": {
    "country": "Pakistan",
    "city": "Islamabad",
    "currency": "PKR",
    "currency_symbol": "₨",
    "last_updated": "2026-05-07",
    "contributor": "NamelessNATM"
  },
  "ingredients": [
    {
      "name": "Potatoes",
      "category": "vegetables",
      "unit": "kg",
      "price_per_unit": 100
    },
    {
      "name": "Cumin seeds",
      "category": "spices",
      "unit": "100g",
      "price_per_unit": 60
    }
  ]
}
```

## Notes

- All prices must be in the local currency. Do not convert.
- Spices are costed like any other ingredient — do not omit them.
- Use English for all ingredient names regardless of the city's language.
- The `unit` field must match exactly what the price_per_unit refers to.
---
