import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRegister } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { mutate: register, isPending, error } = useRegister()

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <TrendingUp className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold">FinFlow AI</span>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-center">Create account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive text-center">Registration failed. Try again.</p>}
            <Input placeholder="Name (optional)" value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
            <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} />
            <Input placeholder="Password (min 8 chars, 1 uppercase, 1 number)" type="password" value={form.password} onChange={e => setForm(s => ({ ...s, password: e.target.value }))} />
            <Button className="w-full" onClick={() => register(form)} disabled={isPending || !form.email || !form.password}>
              {isPending ? 'Creating account...' : 'Create account'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}