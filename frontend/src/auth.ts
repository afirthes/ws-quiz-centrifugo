export async function signup(
    email: string,
    password: string,
    passwordConfirm: string
): Promise<boolean> {
    const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, password_confirm: passwordConfirm }),
    });
    return res.ok;
}

export async function signin(
    email: string,
    password: string
): Promise<boolean> {
    const res = await fetch("/api/auth/signin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return res.ok;
}

export async function signout(): Promise<boolean> {
    const res = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
    });
    return res.ok;
}