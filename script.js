const flashcards = [
  { question: "DNA Polymerase", answer: "الأنزيم المسؤول عن بناء شريط الـ DNA الجديد" },
  { question: "あ (A)", answer: "أول حرف في أبجدية الهيراغانا اليابانية" },
  { question: "Mitochondria", answer: "مصنع الطاقة في الخلية (ATP)" }
];
let currentIndex = 0;

const card = document.getElementById('card');
const frontText = document.getElementById('card-front');
const backText = document.getElementById('card-back');
const progressText = document.getElementById('progress');

function updateCard() {
  card.classList.remove('flipped');
  frontText.textContent = flashcards[currentIndex].question;
  backText.textContent = flashcards[currentIndex].answer;
  progressText.textContent = `Card ${currentIndex + 1} of ${flashcards.length}`;
}

function flipCard() {
  card.classList.toggle('flipped');
}

function nextCard() {
  currentIndex = (currentIndex + 1) % flashcards.length;
  updateCard();
}

function prevCard() {
  currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
  updateCard();
}

updateCard();
