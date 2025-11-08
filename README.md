# QuizzMe!

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

A quiz-taking platform that fetches questions from [Open Trivia DB](https://opentdb.com/api_config.php) and allows users to customize their quiz experience.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Contributing](#-contributing) • [Screenshots](#-screenshots) • [Live](#-live) • [Author](#-author)

</div>

## Features

- **Customizable Quiz Settings** - Select category, difficulty, type, and number of questions.
- **Answer Validation** - Check answers and receive an instant score.
- **Confetti Animation** - Celebrate perfect scores with a visual effect.
- **Dark/Light Mode** - Toggle between themes, with preferences stored in `localStorage`.
- **Fully Responsive** - Adapts to different screen sizes seamlessly.
- **Smooth Animations** - Enhanced user experience with fluid animations.
- **TriviaDB API Status** - Checks if TriviaDB API is up/down before starting the quiz.

## Tech Stack

### Frontend
- **[React](https://reactjs.org/)** - UI component development
- **[Vite](https://vitejs.dev/)** - Fast build tool and development server
- **[Nano ID](https://www.npmjs.com/package/nanoid)** - Unique ID generation
- **[HTML-Entities](https://www.npmjs.com/package/html-entities)** - Decode HTML entities in questions
- **[React-Use](https://www.npmjs.com/package/react-use)** - Custom React hooks
- **[React-Confetti](https://www.npmjs.com/package/react-confetti)** - Celebration animation

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/quizzme.git
   cd quizzme
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   **The application will be accessible at `http://localhost:5173`.**

## Contributing

Contributions are welcome! Here's how you can help improve QuizzMe!:

1. Fork the repository
2. Create a feature branch:

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. Commit your changes:

   ```bash
   git commit -m 'Add some amazing feature'
   ```

4. Push to the branch:

   ```bash
   git push origin feature/amazing-feature
   ```

5. Open a Pull Request

## Screenshots

<div align="center">

### **Landing Page**
![Landing Page](https://github.com/user-attachments/assets/46b8d8c9-8b40-4c20-9668-057ec5d7abc9)

![Landing Page Dark](https://github.com/user-attachments/assets/2e0fa692-1295-4915-84f2-45b47228e29e)

### **Question Selection**
![Options-1](https://github.com/user-attachments/assets/a0056cd4-0a90-43c6-850d-eeaed031eb5b)

![Options-2](https://github.com/user-attachments/assets/09208ccd-8749-4c3f-b653-ba9b0f5e9790)

![Options-3](https://github.com/user-attachments/assets/33992cda-229e-4b52-b683-e0b822331422)

![Options-4](https://github.com/user-attachments/assets/0c7c7222-38f9-43d4-ac50-ce84aaa735fe)

### **Quiz Questions**
![QuizzMe!-Questions-Page](https://github.com/user-attachments/assets/7d5bf1b9-809a-4d6d-81ac-8d0bff18f728)

![QuizzMe!-Questions-Page-Dark](https://github.com/user-attachments/assets/9f7f7783-bd27-488c-ae79-026a2e4e4032)

### **Score Reveal**

https://github.com/user-attachments/assets/91fb544e-4143-4b62-b823-b83ab8bb8411

![QuizzMe!-Questions-Page_Wrong-Answers](https://github.com/user-attachments/assets/3d4080bc-e72e-4bed-b7d9-bdaffacdc20e)

### **Animations**

https://github.com/user-attachments/assets/305f3d04-637e-4fa2-b516-c299e83bf50f

https://github.com/user-attachments/assets/72a4fa99-1771-4c9a-85cd-5e58a33fcc91

https://github.com/user-attachments/assets/3c16d8a6-290a-4e59-a909-abfea60f4e43

https://github.com/user-attachments/assets/4b049b95-7365-490a-a179-0a7770a1947f

https://github.com/user-attachments/assets/a146fc9e-9ac5-4aa0-a59c-83adc645e663

https://github.com/user-attachments/assets/ed5f5990-b43d-475e-a28b-1e82b891f6a1

### **Responsiveness**
#### Mobile S - 320px & Mobile M - 375px

<table>
<tr>
<td width="50%">
  <img src="https://github.com/user-attachments/assets/15a0dd40-f0de-4fdb-839b-6c0d1a0ea2ee" alt="Quiz Setup Screen"/>
</td>
<td width="50%">
  <img src="https://github.com/user-attachments/assets/32c72a61-9770-4e64-836e-fcb5dfb126c0" alt="Quiz Questions Screen"/>
</td>
</tr>
</table>

<table>
<tr>
<td width="50%">
  <img src="https://github.com/user-attachments/assets/ba6e6945-4cda-44db-9ffb-2d21e20bacbb" alt="Quiz Setup Screen" />
</td>
<td width="50%">
  <img src="https://github.com/user-attachments/assets/c5bb1416-c487-4272-b24a-b4a319f90c16" alt="Quiz Questions Screen" />
</td>
</tr>
</table>

#### Mobile L - 425px

<table>
<tr>
<td width="50%">
  <img src="https://github.com/user-attachments/assets/651a50f2-b511-4988-8767-6aada3c58dbb" alt="Quiz Questions Screen" />
</td>
<td width="50%">
  <img src="https://github.com/user-attachments/assets/a13e2b8f-3c1d-4f9e-a570-f2e4e6588757" alt="Quiz Setup Screen" />
</td>
</tr>
</table>

#### Tablet - 768px
![quizz-me vercel app_(iPad Mini) (1)](https://github.com/user-attachments/assets/1722e06f-9da3-4f4f-aef3-12d53ca381d5)

![quizz-me vercel app_(iPad Mini)](https://github.com/user-attachments/assets/21f20961-1b09-462c-814d-790839a8cadf)

![quizz-me vercel app_(Tablet)](https://github.com/user-attachments/assets/6789267e-2548-4b93-b744-eb91292f1fec)

![quizz-me vercel app_(Tablet) (1)](https://github.com/user-attachments/assets/543daf52-d62d-4b5a-8fe9-08895c9bc266)


#### Laptop - 1024px
![quizz-me vercel app_(Laptop)](https://github.com/user-attachments/assets/93965029-f9e5-4272-9816-7f61d9196801)

![quizz-me vercel app_(Laptop) (1)](https://github.com/user-attachments/assets/854e7293-1860-4edc-9f78-948c72f744d0)

![quizz-me vercel app_ (Laptop) (2)](https://github.com/user-attachments/assets/a02de169-85c0-451b-bfbd-ffd15fddfce5)

![quizz-me vercel app_ (Laptop) (3)](https://github.com/user-attachments/assets/4b162ccb-12fb-4754-b4a2-9c1308356c74)

#### Laptop L - 1440px
![quizz-me vercel app_](https://github.com/user-attachments/assets/f6297572-4308-47db-9360-f3aa8190c0b4)

![quizz-me vercel app_ (1)](https://github.com/user-attachments/assets/dbd3073e-9b58-4cb7-bb42-c46a20c8f92a)

![quizz-me vercel app_ (Laptop Large)](https://github.com/user-attachments/assets/3b5d649c-9b9b-4b2b-9b5e-88f59901ee6f)

![quizz-me vercel app_ (Laptop Large)(1)](https://github.com/user-attachments/assets/ecc51a7f-ba9b-4759-9cee-98774901010f)

#### 4k - 2560px
![quizz-me vercel app_ (4k)](https://github.com/user-attachments/assets/4c8c6c06-3bf3-4882-812a-10ff1b5c0645)

![quizz-me vercel app_ (4k) (1)](https://github.com/user-attachments/assets/2a73f0c8-c46b-426b-b86c-c8d6eba94b01)

</div>

## Live

<div align="center">

[![Visit](https://img.shields.io/badge/Visit_Site-000?style=for-the-badge&logo=vercel&logoColor=white)](https://quizz-me.vercel.app/)

</div>

## Author

### Ashwin S Nambiar
- Portfolio: [ashwin.co.in](https://ashwin.co.in)
- GitHub: [@Ashwin-S-Nambiar](https://github.com/Ashwin-S-Nambiar)

---

<div align="center">
Made with ❤️ by Ashwin S Nambiar
</div>
