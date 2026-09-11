export default function Loading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background/80 backdrop-blur-sm fixed top-0 left-0 z-50">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Bolinha giratória externa */}
        <div className="absolute h-full w-full animate-[spin_1.5s_linear_infinite] rounded-full border-4 border-transparent border-t-primary border-r-primary"></div>
        {/* Bolinha giratória interna */}
        <div className="absolute h-10 w-10 animate-[spin_2s_ease-in-out_infinite_reverse] rounded-full border-4 border-transparent border-b-amber-500 border-l-amber-500"></div>
        {/* Ponto central */}
        <div className="h-3 w-3 animate-pulse rounded-full bg-primary"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Carregando...</p>
    </div>
  )
}
