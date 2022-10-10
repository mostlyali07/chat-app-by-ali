import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getFirestore,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    onSnapshot,
    orderBy,
} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCbH8tj9s8JBB-arrqMN8pIH8bAYllY0AA",
    authDomain: "saylani-batch-8.firebaseapp.com",
    databaseURL:
        "https://saylani-batch-8-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "saylani-batch-8",
    storageBucket: "saylani-batch-8.appspot.com",
    messagingSenderId: "248523962565",
    appId: "1:248523962565:web:c7b814c871780785e558ac",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const register = () => {
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email.value, password.value)
        .then(async (userCredential) => {
            let uid = userCredential.user.uid;
            let firDoc = doc(db, "users", uid);
            await setDoc(firDoc, {
                name: name.value,
                email: email.value,
                password: password.value,
            });
        })
        .catch((error) => {
            const errorMessage = error.message;
            console.log(errorMessage);
        });
};

const btn = document.getElementById("register-btn");

btn.addEventListener("click", register);

const login = () => {
    const email = document.getElementById("l-email");
    const password = document.getElementById("l-password");
    const auth = getAuth();
    signInWithEmailAndPassword(auth, email.value, password.value)
        .then((userCredential) => {
            const user = userCredential.user;
            // console.log("user", user);
        })
        .catch((error) => {
            const errorMessage = error.message;
            console.log(errorMessage);
        });
};

const loginBtn = document.getElementById("login-btn");

loginBtn.addEventListener("click", login);

window.onload = async () => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (!user.emailVerified) {
                // sendEmailVerification(auth.currentUser)
                //   .then(() => {
                //     console.log("Email sent");
                //   })
                //   .catch((err) => console.log(err));
            }
            getUserFromDataBase(user.uid);
        } else {
            console.log("not login");
        }
    });
};

const getUserFromDataBase = async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    let currentUser = document.getElementById("current-user");
    if (docSnap.exists()) {
        currentUser.innerHTML = `${docSnap.data().name} (${docSnap.data().email})`;
        getAllUsers(docSnap.data().email, uid, docSnap.data().name);
    } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
    }
};

const getAllUsers = async (email, currentId, currentName) => {
    const q = query(collection(db, "users"), where("email", "!=", email));
    const querySnapshot = await getDocs(q);
    let users = document.getElementById("users");
    querySnapshot.forEach((doc) => {
        users.innerHTML += `<li>${doc.data().name} 
        <button onclick='startChat("${doc.id}","${doc.data().name}","${currentId}","${currentName}")' id="chat-btn">Start Chat</button></li>`;
    });
};

let unsubscribe;

let startChat = (id, name, currentId, currentName) => {
    if (unsubscribe) {
        unsubscribe();
    }
    let chatWith = document.getElementById("chat-with");
    chatWith.innerHTML = name;
    let send = document.getElementById("send");
    let message = document.getElementById("message");
    let chatID;
    if (id < currentId) {
        chatID = `${id}${currentId}`;
    } else {
        chatID = `${currentId}${id}`;
    }
    loadAllChats(chatID, currentId);
    send.addEventListener("click", async () => {
        let allMessages = document.getElementById("all-messages");
        allMessages.innerHTML = "";
        await addDoc(collection(db, "messages"), {
            sender_name: currentName,
            receiver_name: name,
            sender_id: currentId,
            receiver_id: id,
            chat_id: chatID,
            message: message.value,
            timestamp: new Date(),
        });
    });
};

const loadAllChats = (chatID, currentId) => {
    try {
        const q = query(
            collection(db, "messages"),
            where("chat_id", "==", chatID),
            orderBy("timestamp", "asc")
        );
        let allMessages = document.getElementById("all-messages");
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            allMessages.innerHTML = "";
            querySnapshot.forEach((doc) => {
                let className =
                    doc.data().sender_id === currentId ? "my-message" : "user-message";
                allMessages.innerHTML += `<li class="${className}">${doc.data().sender_name
                    }: ${doc.data().message}</li>`;
            });
        });
    } catch (err) {
        console.log(err);
    }
};

window.startChat = startChat;