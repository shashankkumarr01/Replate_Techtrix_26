// ================= Smooth Scroll =================
document.querySelectorAll("a").forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        target.scrollIntoView({ behavior: "smooth" });
    });
});

// ================= Toast Notification =================
const floatingBtn = document.querySelector(".floating-btn");

floatingBtn.addEventListener("click", () => {
    showToast("Leftover Added Successfully!");
});

function showToast(message) {
    const toast = document.createElement("div");
    toast.innerText = message;
    toast.style.position = "fixed";
    toast.style.bottom = "100px";
    toast.style.right = "30px";
    toast.style.background = "#2E7D32";
    toast.style.color = "white";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)";
    toast.style.zIndex = "9999";
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}

// ================= Animated Counter =================
const savingsCard = document.querySelector(".card.success h3");

let count = 0;
const target = 420;

const counter = setInterval(() => {
    count += 10;
    savingsCard.innerText = "₹" + count;

    if (count >= target) {
        clearInterval(counter);
        savingsCard.innerText = "₹" + target;
    }
}, 20);

// ================= Scroll Reveal Animation =================
const revealElements = document.querySelectorAll("section");

window.addEventListener("scroll", () => {
    revealElements.forEach(el => {
        const position = el.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.2;

        if (position < screenPosition) {
            el.style.opacity = 1;
            el.style.transform = "translateY(0)";
        }
    });
});

revealElements.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = "translateY(40px)";
    el.style.transition = "all 0.6s ease";
});