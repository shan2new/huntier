import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface StageActionsProps {
  onComplete: () => void
  onWithdraw: (reason: string) => void
  onReject: () => void
}

export function StageActions({ onComplete, onWithdraw, onReject }: StageActionsProps) {
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')

  const handleWithdrawClick = () => {
    setWithdrawOpen(true)
  }

  const handleConfirmWithdraw = () => {
    const reason = withdrawReason.trim()
    if (!reason) return
    
    onWithdraw(reason)
    setWithdrawOpen(false)
    setWithdrawReason('')
  }

  const handleCancelWithdraw = () => {
    setWithdrawOpen(false)
    setWithdrawReason('')
  }

  return (
    <>
      <div className="mt-12 flex items-center justify-center gap-2">
        <Button
          variant="default"
          size="sm"
          className="h-8 px-3 text-xs bg-primary hover:bg-primary/90"
          onClick={onComplete}
        >
          Complete
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={handleWithdrawClick}
        >
          Withdraw
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={onReject}
        >
          Reject
        </Button>
      </div>

      {/* Withdraw reason dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for withdrawal
              </label>
              <Input
                id="reason"
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Enter reason..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelWithdraw}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmWithdraw}
                disabled={!withdrawReason.trim()}
              >
                Withdraw
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
