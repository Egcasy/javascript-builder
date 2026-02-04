# Firebase Setup Guide (TixHub)

## 1) Firebase project + web app
1. Create or open your Firebase project (already configured for `ticketv-4fb74`).
2. Add a Web App and copy the config values into `src/integrations/firebase/client.ts`.

## 2) Enable Authentication
Enable the following providers in **Firebase Console → Authentication → Sign-in method**:
- Email/Password
- Google (optional, but supported)

## 3) Create Firestore database
1. Create a Firestore database in **Production** mode.
2. Deploy rules from `firestore.rules`.

## 4) Admin access
Admins are defined by documents in the `admins` collection.
Create a document with the admin's UID (from Firebase Auth) as the document ID:
```
admins/{adminUid}
```

## 5) Core collections
The app expects the following collections and fields:

### `events`
```json
{
  "title": "Neon Nights",
  "description": "...",
  "short_description": "...",
  "cover_image": "https://...",
  "images": ["https://..."],
  "date": "2025-02-15",
  "start_time": "21:00",
  "end_time": "02:00",
  "category": "concert",
  "tags": ["nightlife", "dj"],
  "status": "active",
  "is_featured": true,
  "is_hot": true,
  "age_restriction": 18,
  "dress_code": "Smart Casual",
  "total_tickets": 400,
  "sold_tickets": 120,
  "venue_id": "venueDocId",
  "venue": { "name": "Sky Lounge", "address": "Lekki", "city": "Lagos" },
  "organizer": { "id": "sellerUid", "name": "Event Org", "logo": "", "verified": true, "tier": "gold" },
  "ticket_types": [
    {
      "id": "uuid",
      "name": "General Admission",
      "description": "",
      "price": 15000,
      "quantity": 200,
      "sold": 0,
      "max_per_order": 6,
      "benefits": []
    }
  ],
  "ticket_type_ids": ["uuid"],
  "created_at": "2025-02-01T12:00:00.000Z",
  "updated_at": "2025-02-01T12:00:00.000Z",
  "seller_id": "sellerUid"
}
```

### `event_categories`
```json
{ "label": "Friday Night", "emoji": "🎉", "order": 1, "icon": "🎉" }
```

### `venues`
```json
{ "name": "Sky Lounge", "address": "Lekki", "city": "Lagos", "created_at": "..." }
```

### `profiles`
```json
{ "email": "user@email.com", "full_name": "Jane Doe", "phone": "+234...", "avatar_url": "", "created_at": "...", "updated_at": "..." }
```

### `sellers`
```json
{ "user_id": "sellerUid", "business_name": "Event Org", "business_email": "org@email.com", "tier": "bronze", "verified": false, "created_at": "..." }
```

### `orders`
```json
{
  "user_id": "buyerUid",
  "event_id": "eventDocId",
  "status": "pending",
  "total_amount": 35000,
  "discount_amount": 0,
  "promo_code_id": null,
  "event_title": "Neon Nights",
  "event_cover_image": "https://...",
  "event_date": "2025-02-15",
  "created_at": "2025-02-01T12:00:00.000Z"
}
```

### `tickets`
```json
{
  "order_id": "orderDocId",
  "event_id": "eventDocId",
  "ticket_type_id": "uuid",
  "user_id": "buyerUid",
  "qr_code": "TIXHUB-...",
  "status": "pending",
  "created_at": "2025-02-01T12:00:00.000Z",
  "checked_in_at": null
}
```

### `promo_codes`
```json
{
  "seller_id": "sellerUid",
  "code": "SAVE10",
  "discount_type": "percentage",
  "discount_value": 10,
  "max_uses": 100,
  "used_count": 0,
  "min_purchase": 0,
  "expires_at": "2025-03-01T00:00:00.000Z",
  "event_id": null,
  "is_active": true,
  "created_at": "2025-02-01T12:00:00.000Z"
}
```

### `event_reviews`
```json
{ "event_id": "eventDocId", "user_id": "buyerUid", "rating": 5, "comment": "Great!", "created_at": "..." }
```

### `favorites`
```json
{ "event_id": "eventDocId", "user_id": "buyerUid", "created_at": "..." }
```

### Homepage content collections
```json
homepage_features: { "title": "...", "description": "...", "icon": "shield", "order": 1 }
homepage_trust_badges: { "label": "...", "detail": "...", "icon": "badge", "order": 1 }
homepage_how_it_works: { "title": "...", "description": "...", "icon": "search", "order": 1 }
homepage_testimonials: { "name": "...", "role": "...", "quote": "...", "order": 1 }
homepage_partners: { "name": "...", "order": 1 }
homepage_faqs: { "question": "...", "answer": "...", "order": 1 }
```

Supported icon keys in homepage collections:
```
search, card, badge, phone, shield, zap, users
```

## 6) Deploy rules
Use the Firebase CLI:
```
firebase deploy --only firestore:rules
```

## 7) Monnify payment configuration (sandbox)
The checkout flow uses Monnify to redirect users for payment and validates via the payment callback:
- Contract code: `3636171648`
- Base URL: `https://sandbox.monnify.com`
- API key: `MK_TEST_VZ1UGXMXPJ`
- Secret key: `YQFMQKM8TQ4GHCFKXB5E3ELYSHBF98DN`

The callback URL must be reachable at:
```
https://<your-domain>/payment/callback
```
