# 📚 TCS API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer {token}
```

---

## 🔑 Authentication Endpoints

### 1. User Registration
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "secure_password"
}

Response 201:
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "token": "jwt_token"
}
```

### 2. User Login
```
POST /auth/login
Content-Type: application/json

{
  "emailOrPhone": "john@example.com",
  "password": "secure_password"
}

Response 200:
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "user",
  "avatar": "avatar_url",
  "token": "jwt_token"
}
```

### 3. Admin Login
```
POST /auth/admin/login
Content-Type: application/json

{
  "email": "admin@tcs.com",
  "password": "Admin@123"
}

Response 200:
{
  "_id": "admin_id",
  "name": "TCS Admin",
  "email": "admin@tcs.com",
  "role": "admin",
  "token": "jwt_token",
  "adminSettings": {
    "upiId": "admin@upi",
    "storeName": "TCS Store"
  }
}
```

### 4. Get Current User
```
GET /auth/me
Authorization: Bearer {token}

Response 200:
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "addresses": [...]
}
```

### 5. Update Profile
```
PUT /auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "9876543210"
}

Response 200:
{
  "_id": "user_id",
  "name": "Jane Doe",
  "phone": "9876543210",
  ...
}
```

### 6. Add Address
```
POST /auth/address
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Home",
  "street": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "lat": 19.0760,
  "lng": 72.8777,
  "isDefault": true
}

Response 200:
[
  { address object 1 },
  { address object 2 }
]
```

### 7. Get Admin Settings
```
GET /auth/admin/settings
Authorization: Bearer {token}

Response 200:
{
  "_id": "settings_id",
  "admin": "admin_id",
  "upiId": "admin@upi",
  "storeName": "TCS Store",
  "contactEmail": "support@tcs.com",
  "contactPhone": "+91-9876543210",
  "businessAddress": "123 Store St, Mumbai",
  "returnPolicy": "...",
  "socialLinks": {
    "instagram": "https://instagram/tcsstore",
    "facebook": "https://facebook/tcsstore"
  }
}
```

### 8. Update Admin Settings
```
PUT /auth/admin/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "upiId": "admin@upi",
  "storeName": "TCS Store",
  "contactEmail": "support@tcs.com",
  "contactPhone": "+91-9876543210",
  "businessAddress": "123 Store St, Mumbai"
}

Response 200:
{ settings object }
```

---

## 👗 Product Endpoints

### 1. List Products
```
GET /products?gender=Women&category=Co-ord+Sets&sort=newest&limit=20&page=1

Query Parameters:
- gender: Men | Women | Kids | Unisex
- category: Co-ord Sets | Tops | Bottoms | etc.
- isNewArrival: true | false
- isFeatured: true | false
- search: search keyword
- sort: newest | price_asc | price_desc
- limit: items per page (default 20)
- page: page number (default 1)

Response 200:
{
  "products": [
    {
      "_id": "product_id",
      "name": "Floral Co-ord Set",
      "price": 1299,
      "gender": "Women",
      "qualityGrade": "Premium",
      "description": "...",
      "category": "Co-ord Sets",
      "images": ["url1", "url2"],
      "sizes": ["S", "M", "L"],
      "colors": ["Blue", "Red"],
      "stock": 10,
      "isActive": true,
      "isFeatured": false,
      "isNewArrival": true,
      "ratings": { "average": 4.5, "count": 12 }
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

### 2. Get Product Details
```
GET /products/:id

Response 200:
{
  "_id": "product_id",
  "name": "Floral Co-ord Set",
  "price": 1299,
  "originalPrice": 1699,
  "gender": "Women",
  "qualityGrade": "Premium",
  "description": "Beautiful floral print...",
  "category": "Co-ord Sets",
  "images": ["url1", "url2", "url3"],
  "sizes": ["XS", "S", "M", "L", "XL"],
  "colors": ["Blue", "Red", "Green"],
  "stock": 15,
  "isActive": true,
  "isFeatured": true,
  "isNewArrival": true,
  "ratings": { "average": 4.7, "count": 52 }
}
```

### 3. Create Product (Admin)
```
POST /products
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
{
  "name": "Floral Co-ord Set",
  "price": "1299",
  "originalPrice": "1699",
  "gender": "Women",
  "qualityGrade": "Premium",
  "description": "Beautiful floral co-ord set",
  "category": "Co-ord Sets",
  "sizes": "[\"S\", \"M\", \"L\"]",
  "colors": "[\"Blue\", \"Red\"]",
  "stock": "10",
  "images": [File1, File2, File3],
  "isFeatured": "true",
  "isNewArrival": "true"
}

Response 201:
{ product object created }
```

### 4. Update Product (Admin)
```
PUT /products/:id
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data: (same as create)

Response 200:
{ updated product object }
```

### 5. Delete Product (Admin)
```
DELETE /products/:id
Authorization: Bearer {token}

Response 200:
{ "message": "Product deleted" }
```

---

## 🛒 Cart Endpoints

### 1. Get Cart
```
GET /cart
Authorization: Bearer {token}

Response 200:
{
  "_id": "cart_id",
  "user": "user_id",
  "items": [
    {
      "product": "product_id",
      "name": "Floral Co-ord Set",
      "price": 1299,
      "image": "url",
      "quantity": 2,
      "size": "M",
      "color": "Blue"
    }
  ],
  "totalItems": 2,
  "totalPrice": 2598
}
```

### 2. Add to Cart
```
POST /cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 1,
  "size": "M",
  "color": "Blue"
}

Response 200:
{ cart object with item added }
```

### 3. Update Cart Item
```
PUT /cart/item/:itemIndex
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}

Response 200:
{ updated cart object }
```

### 4. Remove from Cart
```
DELETE /cart/item/:itemIndex
Authorization: Bearer {token}

Response 200:
{ cart object with item removed }
```

### 5. Clear Cart
```
DELETE /cart
Authorization: Bearer {token}

Response 200:
{ "message": "Cart cleared" }
```

---

## 📦 Order Endpoints

### 1. Create Order
```
POST /orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "product": "product_id",
      "quantity": 1,
      "size": "M",
      "color": "Blue"
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "phone": "9876543210",
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "paymentMethod": "UPI",
  "notes": "Please deliver carefully"
}

Response 201:
{
  "_id": "order_id",
  "orderNumber": "TCS000001",
  "user": "user_id",
  "items": [...],
  "totalAmount": 1348,
  "shippingCharge": 49,
  "status": "Pending",
  "paymentMethod": "UPI",
  "paymentStatus": "Pending",
  "shippingAddress": {...},
  "statusHistory": [
    { "status": "Pending", "timestamp": "...", "note": "Order placed" }
  ]
}
```

### 2. Get My Orders
```
GET /orders/my
Authorization: Bearer {token}

Response 200:
[
  { order object 1 },
  { order object 2 }
]
```

### 3. Get Order Details
```
GET /orders/:id
Authorization: Bearer {token}

Response 200:
{
  "_id": "order_id",
  "orderNumber": "TCS000001",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  },
  "items": [
    {
      "product": {
        "_id": "product_id",
        "name": "Product Name",
        "images": [...]
      },
      "name": "Product Name",
      "price": 1299,
      "quantity": 1,
      "size": "M"
    }
  ],
  "totalAmount": 1348,
  "shippingCharge": 49,
  "status": "Pending",
  "paymentStatus": "Pending",
  "paymentMethod": "UPI",
  "shippingAddress": {...},
  "statusHistory": [...]
}
```

### 4. Get All Orders (Admin)
```
GET /orders?status=Pending&page=1&limit=20
Authorization: Bearer {token}

Query Parameters:
- status: Pending | Confirmed | Processing | Shipped | Delivered | Cancelled
- page: page number
- limit: items per page

Response 200:
{
  "orders": [...],
  "total": 100
}
```

### 5. Update Order Status (Admin)
```
PUT /orders/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "Confirmed",
  "paymentStatus": "Paid",
  "note": "Order confirmed and processing"
}

Response 200:
{ updated order object }
```

### 6. Download Receipt
```
GET /orders/:id/receipt
Authorization: Bearer {token}

Response: PDF file
Content-Type: application/pdf
Content-Disposition: attachment; filename=TCS-Receipt-{orderNumber}.pdf
```

---

## 💳 Payment Endpoints

### 1. Get Razorpay Key
```
GET /payment/key

Response 200:
{
  "key": "rzp_test_xxxxx"
}
```

### 2. Create Razorpay Order
```
POST /payment/create-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 1348,
  "orderId": "order_id"
}

Response 200:
{
  "id": "order_rzp_id",
  "currency": "INR",
  "amount": 134800
}
```

### 3. Verify Payment
```
POST /payment/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "pay_id",
  "razorpay_signature": "signature",
  "orderId": "order_id"
}

Response 200:
{
  "success": true,
  "message": "Payment verified"
}
```

---

## 🔐 Admin-Only Endpoints

The following endpoints require `role: "admin"`:
- `POST /products` - Create product
- `PUT /products/:id` - Edit product
- `DELETE /products/:id` - Delete product
- `GET /orders` - View all orders
- `PUT /orders/:id/status` - Update order status
- `GET /auth/admin/settings` - Get settings
- `PUT /auth/admin/settings` - Update settings

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "message": "Internal server error"
}
```

---

## 🧪 Testing Endpoints

### Postman Collection
Download or import: `postman_collection.json`

### Test Commands
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"john@test.com","password":"test123"}'

# Get Products
curl http://localhost:5000/api/products?gender=Women

# Health Check
curl http://localhost:5000/api/health
```

---

## 📝 Request/Response Format

### JSON Request
```
Content-Type: application/json

{
  "key": "value",
  "nested": {
    "key": "value"
  }
}
```

### Multipart Request (File Upload)
```
Content-Type: multipart/form-data

FormData {
  "name": "Product Name",
  "images": [File1, File2]
}
```

### Response Format
```
{
  "data": {},
  "message": "Success",
  "timestamp": "2026-02-26T10:00:00Z"
}
```

---

## 🔄 Pagination

List endpoints support pagination:
```
?page=1&limit=20

Response includes:
{
  "data": [...],
  "page": 1,
  "limit": 20,
  "total": 100,
  "pages": 5
}
```

---

## 📊 Rate Limiting
(Future feature)
- 100 requests per minute per IP
- 1000 requests per hour per token

---

**Last Updated**: February 2026
**API Version**: 1.0
**Stability**: Production Ready ✅
