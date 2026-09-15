import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// 許可する画像ホスト (Supabase Storage のみ)
const ALLOWED_IMAGE_HOSTS = [
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
]

function isSafeImageUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    // https のみ許可
    if (parsed.protocol !== 'https:') return false
    // 許可ホストに一致するか確認
    return ALLOWED_IMAGE_HOSTS.some(
      (host) => host && parsed.origin === new URL(host).origin
    )
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // タイトル・著者を 100 文字以内にトリム
    const rawTitle = searchParams.get('title') ?? 'デジタルアトリエ'
    const rawAuthor = searchParams.get('author') ?? 'アトリエの絵師'
    const title = rawTitle.slice(0, 100)
    const author = rawAuthor.slice(0, 50)

    // 画像 URL は許可リストで検証
    const rawImage = searchParams.get('image')
    const safeImage = isSafeImageUrl(rawImage) ? rawImage : null

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#F7F5F0',
            backgroundImage:
              'radial-gradient(#D6D1C7 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            padding: '60px 80px',
            fontFamily: 'sans-serif',
            color: '#23272E',
            border: '12px solid #2D4B75',
          }}
        >
          {/* Header mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '24px',
              fontWeight: 600,
              color: '#2D4B75',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: '#BD5D38',
                borderRadius: '2px',
              }}
            />
            デジタルアトリエ | Digital Atelier
          </div>

          {/* Main Title & Image preview layout */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  color: '#23272E',
                  lineHeight: 1.3,
                  maxHeight: '180px',
                  overflow: 'hidden',
                }}
              >
                {title.length > 50 ? title.slice(0, 50) + '…' : title}
              </div>

              <div
                style={{
                  fontSize: '26px',
                  color: '#656D76',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>by {author}</span>
              </div>
            </div>

            {safeImage && (
              <div
                style={{
                  display: 'flex',
                  width: '240px',
                  height: '240px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '3px solid #D6D1C7',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={safeImage}
                  alt="Artwork preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>

          {/* Footer tagline */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '2px solid #D6D1C7',
              paddingTop: '20px',
              fontSize: '20px',
              color: '#656D76',
            }}
          >
            <span>未完成のまま置いていく、創作の実験場</span>
            <span>https://digital-atelier.app</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: unknown) {
    const error = e as Error
    return new Response(`Failed to generate OGP image: ${error?.message}`, {
      status: 500,
    })
  }
}
