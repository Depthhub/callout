'use client'

import { useEffect, useState, useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

interface MiniAppContext {
  isInMiniApp: boolean
  isReady: boolean
  user: {
    fid?: number
    username?: string
    displayName?: string
    pfpUrl?: string
  } | null
}

export function useMiniApp() {
  const [context, setContext] = useState<MiniAppContext>({
    isInMiniApp: false,
    isReady: false,
    user: null,
  })

  useEffect(() => {
    const init = async () => {
      try {
        // Check if we're running inside a frame/mini app
        const frameContext = await sdk.context

        if (frameContext) {
          setContext({
            isInMiniApp: true,
            isReady: true,
            user: frameContext.user ? {
              fid: frameContext.user.fid,
              username: frameContext.user.username,
              displayName: frameContext.user.displayName,
              pfpUrl: frameContext.user.pfpUrl,
            } : null,
          })

          // Signal that the app is ready
          sdk.actions.ready()
        } else {
          // Not in a mini app context
          setContext({
            isInMiniApp: false,
            isReady: true,
            user: null,
          })
        }
      } catch (error) {
        // Not in a frame context, running as standalone web app
        setContext({
          isInMiniApp: false,
          isReady: true,
          user: null,
        })
      }
    }

    init()
  }, [])

  // Open external URL in mini app context
  const openUrl = useCallback((url: string) => {
    if (context.isInMiniApp) {
      sdk.actions.openUrl(url)
    } else {
      window.open(url, '_blank')
    }
  }, [context.isInMiniApp])

  // Close the mini app
  const close = useCallback(() => {
    if (context.isInMiniApp) {
      sdk.actions.close()
    }
  }, [context.isInMiniApp])

  // Compose a cast (share to social)
  const composeCast = useCallback((text: string, embeds?: string[]) => {
    if (context.isInMiniApp) {
      const embedsArray = embeds && embeds.length > 0
        ? embeds.slice(0, 2).map(url => url) as [string] | [string, string]
        : undefined
      sdk.actions.composeCast({
        text,
        embeds: embedsArray,
      })
    }
  }, [context.isInMiniApp])

  return {
    ...context,
    openUrl,
    close,
    composeCast,
  }
}
