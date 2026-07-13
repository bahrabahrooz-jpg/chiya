"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/data";
import { toast } from "@/components/feedback/toast";
import { openAuth, useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import "./account.css";

const emailish = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * ProfileApp — the member's "My Profile" page. A view/edit card mirroring the
 * mobile edit-profile flow (avatar, name, email, phone, location + delete
 * account), rebuilt with the website's design system and header/footer chrome.
 */
export function ProfileApp() {
  const { user, logout } = useAuth();
  const { profile, update } = useProfile();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [avatar, setAvatar] = useState<string | null>(profile.avatar);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Listing/profile requires an account; nudge signed-out visitors to the modal.
  useEffect(() => {
    if (!user) openAuth("login", { note: "Sign in to view your profile.", next: "/account/profile" });
  }, [user]);

  // Seed the edit fields from the current (hydrated) profile when opening edit.
  const startEdit = () => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setPhone(profile.phone);
    setLocation(profile.location);
    setAvatar(profile.avatar);
    setErrors({});
    setEditing(true);
  };

  if (!user) {
    return (
      <main className="acc-main">
        <Container>
          <EmptyState
            icon="lock"
            title="Sign in to view your profile"
            description="Your Chiya profile keeps your saved homes, listings, and notifications in one place."
            action={
              <Button hierarchy="primary" iconLeading="log-in" onClick={() => openAuth("login", { next: "/account/profile" })}>
                Sign in
              </Button>
            }
          />
        </Container>
      </main>
    );
  }

  const role = user.type === "agent" ? "Agent" : "Member";

  const cancel = () => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setPhone(profile.phone);
    setLocation(profile.location);
    setAvatar(profile.avatar);
    setErrors({});
    setEditing(false);
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const save = () => {
    const next: typeof errors = {};
    if (fullName.trim().length < 2) next.fullName = "Please enter your full name.";
    if (!emailish(email)) next.email = "Please enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    update({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      avatar,
    });
    setEditing(false);
    toast({ title: "Profile updated", variant: "success" });
  };

  const doDelete = () => {
    setConfirmDelete(false);
    logout();
    toast({ title: "Account deleted" });
    router.push("/");
  };

  return (
    <main className="acc-main">
      <Container className="acc-col">
        <nav className="acc-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Icon name="chevron-right" size={14} />
          <span>My Profile</span>
        </nav>

        <PageHeader
          title="My Profile"
          subtitle="Manage your personal details and how agents can reach you."
          actions={
            editing ? (
              <>
                <Button hierarchy="secondary" onClick={cancel}>
                  Cancel
                </Button>
                <Button hierarchy="primary" iconLeading="check" onClick={save}>
                  Save changes
                </Button>
              </>
            ) : (
              <Button hierarchy="secondary" iconLeading="pencil" onClick={startEdit}>
                Edit profile
              </Button>
            )
          }
        />

        <div className="acc-card" style={{ marginTop: 24 }}>
          <div className="acc-prof__banner">
            <div className="acc-prof__avwrap">
              <Avatar src={avatar || undefined} name={fullName || user.name} size="xl" />
              {editing && (
                <button
                  type="button"
                  className="acc-prof__photobtn"
                  aria-label="Change photo"
                  onClick={() => fileRef.current?.click()}
                >
                  <Icon name="camera" size={15} />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
            </div>
            <div className="acc-prof__id">
              <div className="acc-prof__name">{fullName || user.name}</div>
              {profile.email && <div className="acc-prof__sub">{profile.email}</div>}
              <span className="acc-prof__role">
                <Icon name="badge-check" size={13} />
                {role}
              </span>
            </div>
          </div>

          {editing ? (
            <div className="acc-form">
              <div className="acc-form__full">
                <Input
                  label="Full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((x) => ({ ...x, fullName: undefined }));
                  }}
                  iconLeading="user"
                  placeholder="Your name"
                  error={errors.fullName}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
                }}
                iconLeading="mail"
                placeholder="you@email.com"
                error={errors.email}
              />
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                iconLeading="phone"
                placeholder="+964 750 000 0000"
              />
              <div className="acc-form__full">
                <Input
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  iconLeading="map-pin"
                  placeholder="City, Kurdistan"
                />
              </div>
            </div>
          ) : (
            <div className="acc-form">
              <ReadonlyRow label="Full name" icon="user" value={profile.fullName || user.name} />
              <ReadonlyRow label="Email" icon="mail" value={profile.email} />
              <ReadonlyRow label="Phone" icon="phone" value={profile.phone} placeholder="Not provided" />
              <ReadonlyRow label="Location" icon="map-pin" value={profile.location} placeholder="Not provided" />
            </div>
          )}
        </div>

        {!editing && (
          <div className="acc-prof__danger">
            <Button hierarchy="destructive" iconLeading="trash-2" onClick={() => setConfirmDelete(true)}>
              Delete account
            </Button>
          </div>
        )}
      </Container>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        icon="trash-2"
        title="Delete your account?"
        subtitle="This will sign you out and remove your profile from this device. This can’t be undone."
        size="sm"
        footerSpread
        footer={
          <>
            <Button hierarchy="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button hierarchy="destructive" iconLeading="trash-2" onClick={doDelete}>
              Delete account
            </Button>
          </>
        }
      />
    </main>
  );
}

function ReadonlyRow({
  label,
  icon,
  value,
  placeholder,
  full,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  value?: string;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <div className={"acc-ro" + (full ? " acc-form__full" : "")}>
      <span className="acc-ro__label">{label}</span>
      <span className={"acc-ro__value" + (value ? "" : " acc-ro__value--muted")}>
        <Icon name={icon} size={17} />
        {value || placeholder || "—"}
      </span>
    </div>
  );
}
