import { NextResponse } from "next/server";

export function PATCH() {

    let response = NextResponse.json({ success: true })

    response.cookies.delete('user_session');

    return response
}