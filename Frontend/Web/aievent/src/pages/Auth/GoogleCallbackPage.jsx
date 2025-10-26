import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { googleLogin } from '../../store/slices/authSlice';
import { showError, showSuccess, authMessages } from '../../lib/toastUtils';
import { PATH } from '../../routes/path';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        if (error) {
          console.error('Google OAuth error:', error);
          showError('Đăng nhập Google thất bại. Vui lòng thử lại.');
          navigate(PATH.LOGIN, { replace: true });
          return;
        }

        if (!code) {
          showError('Không nhận được mã xác thực từ Google.');
          navigate(PATH.LOGIN, { replace: true });
          return;
        }

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: window.location.origin + '/auth/google-callback',
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error('Token exchange failed:', errorData);
          throw new Error('Failed to exchange code for tokens');
        }

        const tokenData = await tokenResponse.json();

        // Get user info from Google
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to get user info');
        }

        const userInfo = await userResponse.json();

        const mockIdToken = btoa(JSON.stringify({
          sub: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        }));

        const result = await dispatch(googleLogin(mockIdToken)).unwrap();

        if (result) {
          showSuccess(
            authMessages.loginSuccess(
              result.user.unique_name || result.user.email || "Bạn"
            )
          );
          navigate(PATH.HOME, { replace: true });
        }

      } catch (err) {
        console.error('Google callback error:', err);
        showError('Đăng nhập Google thất bại. Vui lòng thử lại.');
        navigate(PATH.LOGIN, { replace: true });
      }
    };

    handleGoogleCallback();
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
