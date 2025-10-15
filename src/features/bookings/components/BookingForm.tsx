'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const BookingFormSchema = z.object({
  userName: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 최대 50자까지 입력할 수 있습니다')
    .transform(s => s.trim()),
  userPhone: z
    .string()
    .regex(/^[0-9]{10,11}$/, '전화번호는 10-11자리 숫자여야 합니다'),
  password: z
    .string()
    .regex(/^[0-9]{4}$/, '비밀번호는 4자리 숫자여야 합니다'),
});

type BookingFormData = z.infer<typeof BookingFormSchema>;

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  isLoading: boolean;
}

export function BookingForm({ onSubmit, isLoading }: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(BookingFormSchema),
    mode: 'onChange',
  });

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 입력 가능하도록 처리
    const value = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = value;
  };

  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 입력 가능하도록 처리
    const value = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">예약자 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 예약자명 */}
          <div className="space-y-2">
            <Label htmlFor="userName">예약자명 *</Label>
            <Input
              id="userName"
              {...register('userName')}
              placeholder="홍길동"
              disabled={isLoading}
              autoComplete="name"
            />
            {errors.userName && (
              <p className="text-sm text-destructive">{errors.userName.message}</p>
            )}
          </div>

          {/* 전화번호 */}
          <div className="space-y-2">
            <Label htmlFor="userPhone">전화번호 *</Label>
            <Input
              id="userPhone"
              {...register('userPhone')}
              placeholder="01012345678"
              maxLength={11}
              disabled={isLoading}
              autoComplete="tel"
              onChange={handlePhoneInput}
            />
            {errors.userPhone && (
              <p className="text-sm text-destructive">{errors.userPhone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              숫자만 입력 (하이픈 제외)
            </p>
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호 (4자리) *</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="1234"
              maxLength={4}
              disabled={isLoading}
              autoComplete="off"
              onChange={handlePasswordInput}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              예약 조회 시 사용됩니다
            </p>
          </div>

          {/* 제출 버튼 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                예약 처리 중...
              </>
            ) : (
              '예약 완료'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}