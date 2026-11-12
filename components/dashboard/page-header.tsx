import * as React from 'react'
import { AppIcon } from '@/components/shared/app-icon'

interface PageHeaderProps {
  title: string
  description?: string
  /** Ícone ilustrado de public/assets/icons, o mesmo do menu lateral */
  iconUrl?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, iconUrl, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {iconUrl && (
          <div className="h-11 w-11 shrink-0">
            <AppIcon src={iconUrl} />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {children}
        </div>
      )}
    </div>
  )
}
