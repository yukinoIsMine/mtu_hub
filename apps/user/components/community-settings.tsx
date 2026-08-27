'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Trash2, UserMinus, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useInteractions } from '@/components/interactions-provider'
import { accentClass, type CommunityAccent } from '@/lib/accent'
import {
  cancelForumAdminInvite,
  inviteForumAdmin,
  kickCommunityMember,
  removeForumAdmin,
  replaceCommunityRules,
  updateCommunityMeta,
} from '@/lib/browser-mutations'
import { communityLabel, formatDate, userLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  Community,
  CommunityMember,
  ForumAdminInviteRow,
} from '@/lib/types'

const ACCENTS: CommunityAccent[] = [
  'teal',
  'teal_deep',
  'orange',
  'blue',
  'green',
  'navy',
  'emerald',
  'indigo',
]

type Tab = 'general' | 'rules' | 'admins' | 'members'

export function CommunitySettings({
  community,
  members,
  pendingInvites,
  forumAdmins,
}: {
  community: Community
  members: CommunityMember[]
  pendingInvites: ForumAdminInviteRow[]
  forumAdmins: { profileId: string; username: string }[]
}) {
  const router = useRouter()
  const { currentUser } = useInteractions()
  const [tab, setTab] = useState<Tab>('general')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(community.name)
  const [description, setDescription] = useState(community.description)
  const [accent, setAccent] = useState(community.accent)
  const [tagsRaw, setTagsRaw] = useState(community.tags.join(', '))
  const [rulesRaw, setRulesRaw] = useState(community.rules.join('\n'))
  const [inviteUsername, setInviteUsername] = useState('')

  async function saveGeneral() {
    if (!currentUser) return
    setSaving(true)
    setError(null)
    try {
      const tags = tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      await updateCommunityMeta({
        communityId: community.id,
        name: name.trim(),
        description: description.trim(),
        accent,
        tags,
      })
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function saveRules() {
    setSaving(true)
    setError(null)
    try {
      const rules = rulesRaw
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
      await replaceCommunityRules(community.id, rules)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function sendInvite() {
    if (!currentUser || !inviteUsername.trim()) return
    setSaving(true)
    setError(null)
    try {
      await inviteForumAdmin({
        communityId: community.id,
        inviteeUsername: inviteUsername.trim(),
        invitedByProfileId: currentUser.id,
      })
      setInviteUsername('')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function cancelInvite(inviteId: string) {
    setError(null)
    try {
      await cancelForumAdminInvite(inviteId)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function demoteAdmin(profileId: string) {
    setError(null)
    try {
      await removeForumAdmin({ communityId: community.id, profileId })
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function kickMember(profileId: string) {
    setError(null)
    try {
      await kickCommunityMember({ communityId: community.id, profileId })
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'rules', label: 'Rules' },
    { id: 'admins', label: 'Forum admins' },
    { id: 'members', label: 'Members' },
  ]

  return (
    <div className="space-y-4">
      <Link
        href={`/m/${community.slug}`}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {communityLabel(community.slug)}
      </Link>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Manage {community.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Forum admin settings for {communityLabel(community.slug)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 border-b border-border pb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {tab === 'general' && (
          <div className="mt-4 space-y-3">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Field>
            <Field label="Accent">
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAccent(a)}
                    className={cn(
                      'size-8 rounded-full ring-offset-2 ring-offset-card',
                      accentClass(a),
                      accent === a && 'ring-2 ring-foreground',
                    )}
                    aria-label={a}
                  />
                ))}
              </div>
            </Field>
            <Field label="Tags (comma-separated)">
              <Input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
              />
            </Field>
            <Button onClick={saveGeneral} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}

        {tab === 'rules' && (
          <div className="mt-4 space-y-3">
            <Field label="Rules (one per line)">
              <Textarea
                value={rulesRaw}
                onChange={(e) => setRulesRaw(e.target.value)}
                rows={8}
              />
            </Field>
            <Button onClick={saveRules} disabled={saving}>
              {saving ? 'Saving…' : 'Save rules'}
            </Button>
          </div>
        )}

        {tab === 'admins' && (
          <div className="mt-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Current forum admins
              </h2>
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                {forumAdmins.map((admin) => {
                  const isCreator =
                    community.createdBy != null &&
                    admin.profileId === community.createdBy
                  return (
                    <li
                      key={admin.profileId}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {userLabel(admin.username)}
                        {isCreator ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            Creator
                          </span>
                        ) : null}
                      </span>
                      {!isCreator ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => demoteAdmin(admin.profileId)}
                        >
                          <UserMinus className="size-3.5" />
                          Remove
                        </Button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>

            {pendingInvites.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Pending invites
                </h2>
                <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                  {pendingInvites.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span>
                        {userLabel(inv.inviteeUsername)}
                        <span className="ml-2 text-xs text-muted-foreground">
                          invited by {userLabel(inv.invitedByUsername)}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelInvite(inv.id)}
                      >
                        Cancel
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Invite a forum admin
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                They’ll get a pending invite and must accept before becoming a
                forum admin.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Input
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="username"
                  className="max-w-xs"
                />
                <Button
                  onClick={sendInvite}
                  disabled={saving || !inviteUsername.trim()}
                >
                  <UserPlus className="size-3.5" />
                  {saving ? 'Sending…' : 'Send invite'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-foreground">
              Members ({members.length})
            </h2>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {members.length === 0 ? (
                <li className="px-3 py-4 text-sm text-muted-foreground">
                  No members yet.
                </li>
              ) : (
                members.map((m) => (
                  <li
                    key={m.profileId}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-foreground">
                        {userLabel(m.username)}
                      </span>
                      {m.isForumAdmin ? (
                        <span className="ml-2 text-xs text-primary">
                          Forum admin
                        </span>
                      ) : null}
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Joined {formatDate(m.joinedAt)}
                      </span>
                    </span>
                    {!m.isCreator ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => kickMember(m.profileId)}
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Creator
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
