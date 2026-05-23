'use client';

import { useEffect, useMemo, useState } from 'react';

interface OTPVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: (verificationToken: string) => void;
  onVerificationFailed: (error: string) => void;
}

type OTPState = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error';

export default function OTPVerification({
  phoneNumber,
  onVerificationSuccess,
  onVerificationFailed,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [state, setState] = useState<OTPState>('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [requestId, setRequestId] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  const isValidPhone = useMemo(() => {
    const digits = phoneNumber.replace(/\D/g, '');
    return /^\d{10}$/.test(digits);
  }, [phoneNumber]);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0 && state === 'sent') {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, state]);

  // Reset OTP when phone changes
  useEffect(() => {
    setOtp('');
    setRequestId('');
    setError('');
    setSuccess('');
    setState('idle');
    setTimeLeft(0);
    setAttemptsRemaining(5);
  }, [phoneNumber]);

  const handleSendOTP = async () => {
    if (!isValidPhone) {
      setError('Please enter a valid 10-digit phone number');
      onVerificationFailed('Invalid phone number');
      return;
    }

    setState('sending');
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to send OTP';
        setError(errorMsg);
        setState('error');
        onVerificationFailed(errorMsg);
        return;
      }

      setRequestId(data.requestId);
      setTimeLeft(60);
      setState('sent');
      setSuccess(
        `OTP sent to ${data.phoneNumber}. Check your SMS or WhatsApp.`
      );
      setOtp('');
      setAttemptsRemaining(5);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Network error sending OTP';
      setError(errorMsg);
      setState('error');
      onVerificationFailed(errorMsg);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!requestId) {
      setError('Please send OTP first');
      return;
    }

    setState('verifying');
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          otpCode: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Invalid OTP';
        setError(errorMsg);
        setState('error');

        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }

        if (response.status === 429) {
          onVerificationFailed('Too many attempts. Please request a new OTP.');
        } else {
          onVerificationFailed(errorMsg);
        }
        return;
      }

      setState('verified');
      setSuccess('Phone number verified successfully!');
      setOtp('');
      onVerificationSuccess(data.verificationToken);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Network error verifying OTP';
      setError(errorMsg);
      setState('error');
      onVerificationFailed(errorMsg);
    }
  };

  const isLoading = state === 'sending' || state === 'verifying';

  if (state === 'verified') {
    return (
      <div className="p-6 bg-green-50 border-2 border-green-300 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-green-700 font-semibold">Phone verified</p>
            <p className="text-sm text-green-600">{phoneNumber}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600 font-medium">{success}</p>
        </div>
      )}

      {state === 'idle' || state === 'error' ? (
        <button
          onClick={handleSendOTP}
          disabled={isLoading || !isValidPhone}
          className="w-full px-6 py-3 bg-gradient-to-r from-[#1f6f3d] to-[#2f8a53] text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Sending...' : 'Send OTP'}
        </button>
      ) : state === 'sent' ? (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2f8a53]/50"
              disabled={isLoading}
            />
            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#2f8a53] text-white font-semibold rounded-lg hover:bg-[#1f6f3d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          <div className="flex justify-between items-center text-sm">
            {timeLeft > 0 ? (
              <p className="text-gray-600">
                Resend in <span className="font-semibold">{timeLeft}s</span>
              </p>
            ) : (
              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="text-[#2f8a53] hover:underline font-semibold"
              >
                Resend OTP
              </button>
            )}
            <p className="text-gray-500 text-xs">
              {attemptsRemaining === 5
                ? ''
                : `${attemptsRemaining} attempts left`}
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center">
            OTP valid for 5 minutes
          </p>
        </div>
      ) : null}
    </div>
  );
}
