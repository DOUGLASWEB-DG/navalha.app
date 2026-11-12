import { AppIcon } from '@/components/shared/app-icon'

interface WhatsAppIconProps { className?: string }
export function WhatsAppIcon({ className }: WhatsAppIconProps) {
  return <AppIcon src="/assets/icons/navegacao-painel/whatsapp.png" className={className} />
}
