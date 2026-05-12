import React, { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACTS, monadTestnet } from '../config'
import { GACHA_POOL_ABI } from '../abis'
import { RarityBadge } from './RarityBadge'
import { useLang } from '../i18n'

interface PullEvent {
  buyer: string
  poolId: bigint
  cardId: bigint
  tokenId: bigint
  rarity: number
  cardName: string
  txHash: string
}

const POOL_NAMES = ['Pokemon', 'Monad Genesis']

export const LivePullsFeed: React.FC = () => {
  const client = usePublicClient({ chainId: monadTestnet.id })
  const [pulls, setPulls] = useState<PullEvent[]>([])
  const { t } = useLang()

  useEffect(() => {
    if (!client) return

    // Fetch recent PullResult events (last 200 blocks)
    const fetchRecent = async () => {
      try {
        const block = await client.getBlockNumber()
        const fromBlock = block > 200n ? block - 200n : 0n
        const logs = await client.getLogs({
          address: CONTRACTS.gachaPool,
          event: GACHA_POOL_ABI.find((e) => e.type === 'event' && e.name === 'PullResult') as any,
          fromBlock,
          toBlock: 'latest',
        })
        const events: PullEvent[] = logs
          .reverse()
          .slice(0, 12)
          .map((log: any) => ({
            buyer: log.args.buyer as string,
            poolId: log.args.poolId as bigint,
            cardId: log.args.cardId as bigint,
            tokenId: log.args.tokenId as bigint,
            rarity: Number(log.args.rarity),
            cardName: log.args.cardName as string,
            txHash: log.transactionHash ?? '',
          }))
        setPulls(events)
      } catch (_) {
        // silently ignore
      }
    }

    fetchRecent()

    // Watch for new events
    const unwatch = client.watchEvent({
      address: CONTRACTS.gachaPool,
      event: GACHA_POOL_ABI.find((e) => e.type === 'event' && e.name === 'PullResult') as any,
      onLogs: (logs: any[]) => {
        const newPulls: PullEvent[] = logs.map((log) => ({
          buyer: log.args.buyer,
          poolId: log.args.poolId,
          cardId: log.args.cardId,
          tokenId: log.args.tokenId,
          rarity: Number(log.args.rarity),
          cardName: log.args.cardName,
          txHash: log.transactionHash ?? '',
        }))
        setPulls((prev) => [...newPulls, ...prev].slice(0, 12))
      },
    })

    return () => { unwatch() }
  }, [client])

  if (pulls.length === 0) {
    return (
      <div className="flex items-center gap-3 py-2 text-[8px] text-gray-600">
        <span className="animate-blink">◆</span>
        <span>{t.noPulls}</span>
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {pulls.map((p, i) => (
        <a
          key={`${p.txHash}-${i}`}
          href={`https://testnet.monadexplorer.com/tx/${p.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-2 bg-gray-800 border-2 border-gray-700 px-3 py-2 hover:border-monad-purple transition-colors"
        >
          <RarityBadge rarity={p.rarity} className="text-[6px]" />
          <div className="flex flex-col gap-1">
            <span className="text-[7px] text-white">{p.cardName}</span>
            <span className="text-[6px] text-gray-500">
              {POOL_NAMES[Number(p.poolId)] ?? 'Pool'} · #{p.tokenId.toString()}
            </span>
            <span className="text-[6px] text-gray-600">
              {p.buyer.slice(0, 6)}...{p.buyer.slice(-4)}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
