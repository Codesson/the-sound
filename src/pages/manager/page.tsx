import { useEffect } from "react";

export default function Manager() {
    const onSubmit = async (form: any) => {
        console.log('data: ', form.entries);
        const res = await fetch("/api/login", {
            method: "POST",
            // headers: { "Content-Type": 'multipart/form-data' },
            body: form,
          });
          const result = await res.json();

        console.log('-------------------', result);
    }

    useEffect(() => {
        fetch('api/login').then((res) => {
            console.log('res: ', res);
        })
    }, [])

    return (
        <div className="flex justify-center align-middle h-full">
        <div className="w-80 text-center">
            <h4 className="mb-10 w-full">관리자 시스템</h4>
            <form onSubmit={onSubmit}>
                <div className="flex flex-col justify-center align-middle gap-2">
                    <input name="id" placeholder="아이디"></input>
                    <input name="pw" placeholder="비밀번호"></input>
                </div>
                <button type="submit">로그인</button>
            </form>
        </div>
    </div>
    )
}