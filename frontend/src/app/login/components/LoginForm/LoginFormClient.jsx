'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';

import FormError from './FormError';
import { useTranslation } from '@/context/LanguageProvider';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import { loginAction } from '@/app/login/actions/loginAction';
import '../../LoginStyles.css';

const LIMITS = {
    LOGIN_MIN: 3,
    LOGIN_MAX: 20,
    PASS_MIN: 3,
    PASS_MAX: 64,
};

export default function LoginFormClient({ serverAction = loginAction }) {
    const { lang } = useTranslation();
    const router = useRouter();
    const [serverError, setServerError] = useState('');

    function validate(values) {
        const errors = {};
        const allowedRegex = /[^a-zA-Z0-9]/g;
        setServerError('');

        // Login validation
        if (!values.login) {
            errors.login = lang.errors.noLogin;
        } else if (allowedRegex.test(values.login)) {
            errors.login = lang.errors.illegalSymbols;
        }

        // Password validation
        if (!values.password) {
            errors.password = lang.errors.noPassword;
        }

        return errors;
    }

    const formik = useFormik({
        initialValues: {
            login: '',
            password: '',
        },
        validate,
        validateOnBlur: false,
        validateOnChange: true,
        onSubmit: async (values, { setSubmitting }) => {
            setServerError('');

            try {
                const actionFn = serverAction || loginAction;
                const result = await actionFn(null, values);

                if (result?.success) {
                    router.push('/');
                    router.refresh();
                } else {
                    const errorKey = result?.message || 'server';
                    const message = lang.errors[errorKey] || lang.errors.server;
                    setServerError(message);
                }
            } catch (error) {
                const message = lang.errors.server;
                setServerError(message);
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <>
            <h2 className="login-title">{lang.loginPage.title}:</h2>
            <form className="login-form" onSubmit={formik.handleSubmit}>
            <div className="form-row">
                <label htmlFor="login">{lang.loginPage.loginPlaceholder}:</label>
                <input
                    id="login"
                    name="login"
                    type="text"
                    value={formik.values.login}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                />
            </div>
            {formik.touched.login && formik.errors.login ? <FormError error={formik.errors.login} /> : null}

            <div className="form-row">
                <label htmlFor="password">{lang.loginPage.passwordPlaceholder}:</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                />
                {formik.touched.password && formik.errors.password ? <FormError error={formik.errors.password} /> : null}
            </div>

            <button
                type="submit"
                className="login-button flex items-center justify-center gap-2"
                disabled={formik.isSubmitting || serverError}
            >
                {formik.isSubmitting ? (
                    <>
                        <LoadingSpinner /> {lang.loginPage.loadingButton}
                    </>
                ) : (
                    lang.loginPage.loginButton
                )}
            </button>
            {serverError ? <FormError error={serverError} /> : null}
        </form>
        </>
    );
}
