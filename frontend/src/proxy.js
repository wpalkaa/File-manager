
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";



async function tokenValidation( token ) {
    
    try {
        const SECRET = process.env.SECRET_KEY;
        const encodedSECRET = new TextEncoder().encode( SECRET );

        if (!SECRET) {
            console.error("[ERROR] [Middleware]: SECRET_KEY is undefined.");
        };

        await jwtVerify( token, encodedSECRET );
        return true;
    }
    catch( error ) {
        console.error(`[ERROR] [Middleware]: Error while jwt verification: ${error.message}`)
        return false;
    }
};


export default async function middleware( request ) {

    const sessionCookie = request.cookies.get('user_session');
    const { pathname } = request.nextUrl;


    if( sessionCookie ) {

        // Validate token
        const isValid = await tokenValidation( sessionCookie.value );
        
        // Valid session, redirect from login to home or proceed
        if( isValid ) {
            if( pathname === '/login' ) {
                return NextResponse.redirect( new URL('/', request.url) );
            }
            return NextResponse.next();
        }

        // Invalid session, redirect to login and delete cookie
        console.log("[Debug] [Middleware]: Token neiważny, usuwanie ciastka.")
        const response = NextResponse.redirect( new URL('/login', request.url) );
        response.cookies.delete( 'user_session' );
        return response;
    }

    // If no session, redirect to login
    if( !sessionCookie && pathname !== '/login' ) {
        return NextResponse.redirect( new URL('/login', request.url) );
    }

    return NextResponse.next()
}

export const config = {
    matcher: [ '/', '/login', '/files/:path*', '/resources', '/settings/:path*' ],
}