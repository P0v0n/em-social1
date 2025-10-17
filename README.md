

# 🔍 EmSocial

**EmSocial** is an AI-powered web app that lets you **search posts across Instagram, YouTube, and Twitter** by keyword. You can specify how many posts to fetch, and the app performs **sentiment and engagement analysis** using **Google's Gemini API**. Perfect for **social media marketing**, **trend analysis**, and **brand monitoring**.

# 📷 ScreenShots

![App Screenshot](./assets/em1.png)


![App Screenshot](./assets/em2.png)



## ⚙️ Tech Stack

* **Built With**: Next.js
* **Database**: MongoDB
* **AI**: Gemini API (Google)

## 🚀 Features

* Search social posts by keyword
* Sentiment analysis (positive/negative/neutral)
* Engagement insights (likes, comments, shares)
* Platform comparison
* Useful for marketers, analysts, and brands

## 🛠️ Setup

```bash
git clone `https://github.com/Brijesh-09/emsocial.git`
cd emsocial
npm install
# Create .env.local from .env.example and set values
npm run dev
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required keys:

- `MONGODB_URI`
- `GEMINI_API_KEY`
- `JWT_SECRET`

--------v2--------





