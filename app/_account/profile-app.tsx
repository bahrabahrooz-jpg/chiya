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
 * ProfileApp — the member's "My Profile" page. Mirrors the mobile app's
 * edit-profile screen: a single centred column with a large avatar (tap the
 * badge to change the photo), four stacked fields that read as plain values
 * until you enter edit mode, and a Delete-account action at the foot. Rebuilt
 * with the website's design system and header/footer chrome; the data + logic
 * match the mobile flow, only the presentation is adapted for the web.
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
      <Container className="acc-prof-shell" style={{ maxWidth: 780 }}>
        <nav className="acc-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Icon name="chevron-right" size={14} />
          <span>My Profile</span>
        </nav>

        <PageHeader
          title="My Profile"
          subtitle="Manage your personal details and how agents can reach you."
        />

        <div className="acc-prof3">
          {/* Header — identity on the left, edit / save actions on the right. */}
          <div className="acc-prof3__head">
            <div className="acc-prof3__id">
              <div className="acc-prof3__avwrap">
                <Avatar
                  src={avatar || undefined}
                  name={fullName || user.name}
                  size="xl"
                  className="acc-prof3__av"
                />
                {editing && (
                  <button
                    type="button"
                    className="acc-prof3__photobtn"
                    aria-label="Change photo"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Icon name="camera" size={15} />
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
              </div>
              <div className="acc-prof3__idmeta">
                <div className="acc-prof3__name">{fullName || user.name}</div>
                {profile.email && <div className="acc-prof3__email">{profile.email}</div>}
              </div>
            </div>

            <div className="acc-prof3__actions">
              {editing ? (
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
              )}
            </div>
          </div>

          {/* Fields — two-column form; editable inputs or plain read rows. */}
          <div className="acc-prof3__grid">
            {editing ? (
              <>
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
                <Input
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  iconLeading="map-pin"
                  placeholder="City, Kurdistan"
                />
              </>
            ) : (
              <>
                <ReadField label="Full name" icon="user" value={profile.fullName || user.name} />
                <ReadField label="Email" icon="mail" value={profile.email} placeholder="Not provided" />
                <ReadField label="Phone" icon="phone" value={profile.phone} placeholder="Not provided" />
                <ReadField label="Location" icon="map-pin" value={profile.location} placeholder="Not provided" />
              </>
            )}
          </div>
        </div>

        {!editing && (
          <div className="acc-prof3__danger">
            <div className="acc-prof3__danger-copy">
              <span className="acc-prof3__danger-title">Delete account</span>
              <span className="acc-prof3__danger-desc">
                Permanently remove your profile from this device. This can’t be undone.
              </span>
            </div>
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

/** Read row — a plain, non-editable field: label above, icon + value below. */
function ReadField({
  label,
  icon,
  value,
  placeholder,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  value?: string;
  placeholder?: string;
}) {
  return (
    <div className="cx-field">
      <span className="cx-field__label">{label}</span>
      <div className={"acc-rf" + (value ? "" : " acc-rf--muted")}>
        <Icon name={icon} size={18} />
        <span>{value || placeholder || "—"}</span>
      </div>
    </div>
  );
}
