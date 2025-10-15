'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 예약 완료 페이지에서 뒤로가기를 방지하는 훅
 * - 예약 정보 입력 페이지로 돌아가는 것을 차단
 * - 중복 예약 방지
 */
export const useBlockBack = () => {
  const router = useRouter();

  useEffect(() => {
    // 현재 URL을 히스토리 스택에 추가 (뒤로가기 트랩)
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();

      // 다시 현재 페이지를 푸시하여 뒤로가기 차단
      window.history.pushState(null, '', window.location.href);

      // 홈으로 리다이렉트하려면 확인 필요
      if (window.confirm('예약이 완료되었습니다. 홈으로 이동하시겠습니까?')) {
        router.replace('/');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);
};