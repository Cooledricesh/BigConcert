'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';

const BookingSearchFormSchema = z.object({
  userPhone: z
    .string()
    .regex(/^01[016789]\d{7,8}$/, '올바른 휴대전화 번호를 입력해주세요 (예: 01012345678)'),
  password: z.string().regex(/^[0-9]{4}$/, '비밀번호는 4자리 숫자여야 합니다'),
});

type BookingSearchFormData = z.infer<typeof BookingSearchFormSchema>;

interface BookingSearchFormProps {
  onSubmit: (data: BookingSearchFormData) => void;
  isLoading: boolean;
}

export function BookingSearchForm({ onSubmit, isLoading }: BookingSearchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingSearchFormData>({
    resolver: zodResolver(BookingSearchFormSchema),
    defaultValues: {
      userPhone: '',
      password: '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">예약 조회</CardTitle>
        <CardDescription>
          예약 시 입력하신 전화번호와 비밀번호를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              예약 시 입력한 4자리 숫자
            </p>
          </div>

          {/* 제출 버튼 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                조회 중...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                조회하기
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
