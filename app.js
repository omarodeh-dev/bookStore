import {books, storeName} from './data.js';
import {formatPrice,getTotal,sumAll,createCounter,withLog,debounce,throttle} from './utils.js';
import {getReviewsForBook} from './api.js';
import {setupAsyncDemo , log} from './async.js';

const bookList = document.getElementById('bookList');
const cartList = document.getElementById('cartList');
const totalElement = document.getElementById('total');
const searchInput = document.getElementById('search');
const sortBtn = document.getElementById('sortBtn');
const infoElement = document.getElementById('info');
const savedElement = document.getElementById('saved');

function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    try{
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Error loading cart from storage:", error.message);
        return [];
    }
}

let cart = loadCartFromStorage();
let searchText = "";
let sortOrder = "none";

const countClicks = createCounter();

const message ={
    el:document.getElementById('message'),
    show:(msg)=>{
        message.el.textContent = msg;

        setTimeout(()=>{
            message.el.textContent = "";
        }, 3000);
    },
};

const callbacks = {
    onAdd : (book) => message.show(`Added "${book.title}" to cart.`),
    onRemove : (book) => message.show(`Removed "${book.title}" from cart,`),
};

function getBookstoShow() {
    let result = books.filter(book => book.title.toLowerCase().includes(searchText.toLowerCase())
    );
    if(sortOrder === "asc") {
        result = result.sort((a, b) => a.price - b.price);
    }else if(sortOrder === "desc") {
        result = result.sort((a, b) => b.price - a.price);
    }
    return result;
}

const getRemaining = (book) => book.stock - (cart.find(item => item.id === book.id)?.quantity ?? 0);
const stockText = (remaining) => remaining === 0 ? "Out of Stock" : `In Stock: ${remaining}`;

function updateStock() {
    document.querySelectorAll(".book").forEach((card) => {
        const book = books.find(b => b.id === Number(card.dataset.book));
        const remaining = getRemaining(book);
        const stockElement = card.querySelector(".stock");
        stockElement.textContent = stockText(remaining);
        stockElement.classList.toggle("out-of-stock", remaining === 0);
    });
}

function renderBooks() {
    const list = getBookstoShow();

    if(list.length === 0) {
        bookList.innerHTML = "<li>No books found.</li>";
        return;
    }

    bookList.innerHTML = list.map(book => {
        const{ id, title, author, price, tags} = book;
        const authorName = author?.name ?? "Unknown Author";
        const discount = book.discount ?? "none";

        return `
        <div class="book" data-book ="${id}">
        <h3>${title}</h3>
        <p>Author: ${authorName}</p>
        <p>Price: ${formatPrice(price)} | Discount: ${discount}</p>
        <p>Tags: ${tags.join(", ")}</p>
        <p class="stock"></p>
        <p class="reviews"></p>
        <button class="add-to-cart">Add to Cart</button>
        </div>`;
    }).join("");

    updateStock();
    document.querySelectorAll(".book").forEach((card) => observer.observe(card));
}

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if(entry.isIntersecting) {
                entry.target.classList.add("visible");
                showReviews(entry.target);
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.3 }
);

async function showReviews(card) { 
    const reviewsElement = card.querySelector(".reviews");
    reviewsElement.textContent = "Loading reviews...";

    try {
        const reviews = await getReviewsForBook(card.dataset.book);

        if(reviews.length === 0) {
            reviewsElement.textContent = "No reviews available.";
            return;
        }

        const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        const first = reviews[0];
        reviewsElement.textContent = `Average Rating: ${average.toFixed(1)}
        | First Review: "${first.text}"`;
    } catch (error) {
        reviewsElement.textContent = "Error loading reviews.";
        console.error(error.message);
    }
}

function renderInfo() {
    const allTags = books.flatMap(book => book.tags);
    const uniqueTags = [...new Set(allTags)];
    const anySoldOut = books.some(book => book.stock === 0);
    const allHavePrice = books.every(book => book.price > 0);
    const totalStock = sumAll(...books.map(book => book.stock));

    infoElement.textContent = `${storeName} | ${books.length} books 
    | ${uniqueTags.length} unique tags\
    | ${anySoldOut ? "Some sold out" : "All in stock"} 
    | ${allHavePrice ? "All priced" : "Some free"} | Total stock: ${totalStock}`;
}

function renderCart() {
    if(cart.length === 0) {
        cartList.innerHTML = "<li>Cart is empty.</li>";
    }else {
        cartList.innerHTML = cart
        .map(({id, title, price, quantity}) =>
            `<li data-id ="${id}">
                ${title} - ${formatPrice(price)} x ${quantity}
            </li>`).join("");
    }

    totalElement.textContent = formatPrice(getTotal(cart));
    updateStock();
    saveCartToStorage();
}

const addToCart = withLog("addToCart",(id) => {
    const book = books.find(b => b.id === id);
    const index = cart.findIndex(item => item.id === id);
    const oldCart = cart;

    if(getRemaining(book) <= 0) {
        message.show("No more in stock!");
        return;
    }

    if(index === -1) {
        const {title, price} = book;
        cart =[...cart , {id, title, price, quantity: 1}];
    }else {
        const item = cart[index];
        cart = cart.with(index , {...item, quantity: item.quantity + 1});
    }

    console.log("Cart updated:", oldCart !== cart);

    callbacks.onAdd?.(book);
    renderCart();
});

function removeFromCart(id) {
    const item = cart.find((i) => i.id === id);
    cart = cart.filter((i) => i.id !== id);

    callbacks.onRemove?.(item);
    message.show(`Removed "${item.title}" from cart.`);
    renderCart();
}

function saveCart() {
    const shallowCopy = [...cart];
    const deepCopy = structuredClone(cart);

    if(cart.length === 0) {
        savedElement.textContent = "Cart is empty. Nothing to save.";
        return;
    }

    const key = `cart_${countClicks()}`;
    const backup = { [key]: deepCopy };
    console.log("backup : ", backup);
}

const searchBooks = debounce((event) => {
    searchText = event.target.value;
    renderBooks();
    log(`Search: "${searchText}"`, "info");
}, 300);

searchInput.addEventListener("input",(e) => searchBooks(e));

const topBtn = document.getElementById("topBtn");

const onScroll = throttle(() => {
    topBtn.style.display = window.scrollY > 300 ? "block" : "none";
},200);

window.addEventListener("scroll", onScroll);
topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

sortBtn.addEventListener("click", () => {
    if(sortOrder === "none" || sortOrder === "desc") {
        sortOrder = "asc";
    } else {
        sortOrder = "desc";
    }
    renderBooks();
});

bookList.addEventListener("click", (event) => {
    if(!event.target.matches(".add-to-cart")) return;
    const id = event.target.closest(".book")?.dataset.book;
    if(id) addToCart(Number(id));
});

cartList.addEventListener("click", (event) => {
    const id = event.target.closest("li")?.dataset.id;
    if(id) removeFromCart(Number(id));
});


renderInfo();
renderBooks();
renderCart();
setupAsyncDemo();
saveCart();
