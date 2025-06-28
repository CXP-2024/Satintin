// BookPage.tsx
import React, {useEffect, useState} from "react";
import {QueryBooksMessage} from "Plugins/BookService/APIs/QueryBooksMessage";
import {useUserToken} from "Globals/GlobalStore";
import {Book} from "Plugins/BookService/Objects/Book";
import {QueryBorrowRecordsMessage} from "Plugins/BorrowService/APIs/QueryBorrowRecordsMessage";
import {BorrowBookMessage} from "Plugins/BorrowService/APIs/BorrowBookMessage";
import {ReturnBookMessage} from "Plugins/BorrowService/APIs/ReturnBookMessage";
import {loginPagePath} from "Pages/LoginPage";
import {useHistory} from "react-router";
import {AddBookMessage} from "Plugins/BookService/APIs/AddBookMessage";
import {BookCategory} from "Plugins/BookService/Objects/BookCategory";

export const bookPagePath = "/books";

function randomString(length: number = 5): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
}

export default function BookPage() {
    const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
    const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
    const [message, setMessage] = useState("");
    const userToken=useUserToken();
    const history=useHistory();

    const fetchBooks = () => {
        new QueryBooksMessage(userToken).send(
            (info)=>{
                const books=JSON.parse(info) as Book[];
                setAvailableBooks(books);
            }
        )
        new QueryBorrowRecordsMessage(userToken).send(
            (info)=>{
                const books=JSON.parse(info) as Book[];
                setBorrowedBooks(books);
            }
        )
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleBorrow = (bookId: string) => {
        new BorrowBookMessage(userToken,bookId).send(() => {
            fetchBooks();
        }, (err: any) => {
            setMessage(err.message || "借书失败");
        });
    };

    const handleReturn = (bookId: string) => {
        new ReturnBookMessage(userToken,bookId).send(() => {
            fetchBooks();
        }, (err: any) => {
            setMessage(err.message || "还书失败");
        });
    };
    const addBook=()=>{
        new AddBookMessage(
            userToken,
            randomString(5),
            randomString(5),
            BookCategory.science,
            1
        ).send(()=>{
            fetchBooks()
        })
    }

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 space-y-10">
            {message && <div className="text-red-500">{message}</div>}

            {/* 借书区域 */}
            <div className="border rounded-2xl p-4 shadow">
                <h2 className="text-xl font-bold mb-4">可借图书</h2>
                {availableBooks.length === 0 ? (
                    <div className="text-gray-500">暂无可借图书</div>
                ) : (
                    <ul className="space-y-2">
                        {availableBooks.map((book) => (
                            <li
                                key={book.bookID}
                                className="flex justify-between items-center p-2 border rounded hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleBorrow(book.bookID)}
                            >
                                <span>{book.title}</span>
                                <button className="text-blue-600 text-sm">点击借书</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 还书区域 */}
            <div className="border rounded-2xl p-4 shadow">
                <h2 className="text-xl font-bold mb-4">我已借的图书</h2>
                {borrowedBooks.length === 0 ? (
                    <div className="text-gray-500">你当前没有借书</div>
                ) : (
                    <ul className="space-y-2">
                        {borrowedBooks.map((book) => (
                            <li
                                key={book.bookID}
                                className="flex justify-between items-center p-2 border rounded hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleReturn(book.bookID)}
                            >
                                <span>{book.title}</span>
                                <button className="text-green-600 text-sm">点击还书</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button
                onClick={() => history.push(loginPagePath)}
                className="ml-2 text-sm text-blue-600 hover:underline"
            >
                去登录
            </button>
            <button
                onClick={() => addBook()}
                className="ml-2 text-sm text-blue-600 hover:underline"
            >
                加一本书
            </button>
        </div>
    );
}
