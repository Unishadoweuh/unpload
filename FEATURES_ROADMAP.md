# UnPload - Feature Roadmap & Proposals

This document outlines potential features and improvements for UnPload, organized by priority and complexity.

---

## 🚀 High Priority (Quick Wins)

### 1. Dark Mode Toggle
- **Effort**: Low (2-4h)
- **Impact**: High
- Add a dark/light mode toggle in the header
- Currently dark mode only works via OS preference

### 2. Drag & Drop Upload
- **Effort**: Low (2-4h)
- **Impact**: High
- Add drag-and-drop zone on dashboard
- Visual feedback during drag-over
- Progress indicator for multiple files

### 3. File Preview
- **Effort**: Medium (4-8h)
- **Impact**: High
- Image thumbnails in file list
- Modal preview for images/PDFs/text files
- Video player support

### 4. Breadcrumb Navigation
- **Effort**: Low (1-2h)
- **Impact**: Medium
- Show folder path in dashboard
- Click to navigate up folder hierarchy

---

## 📁 File Management

### 5. Multi-Select Actions
- Select multiple files with checkboxes
- Bulk delete, move, share
- "Select All" functionality

### 6. File/Folder Rename
- Inline rename functionality
- Double-click to edit name

### 7. Move to Folder Dialog
- Modal to select destination folder
- Create new folder from move dialog

### 8. Search & Filter
- Global search across all files
- Filter by type (images, documents, videos)
- Sort by name, date, size

### 9. Trash/Recycle Bin
- Soft delete files for 30 days
- Restore deleted files
- Empty trash option

---

## 🔗 Sharing Enhancements

### 10. Custom Share URLs
- Allow users to set custom slugs
- Example: `/s/my-presentation` instead of `/s/a3b2c1`

### 11. Folder Browsing for Shared Folders
- Currently folder shares show placeholder
- Add file listing in shared folder view
- Zip download for entire folder

### 12. Share Analytics
- View count per share
- Download count over time
- Geographic distribution (optional)

### 13. Email Share
- Send share link via email
- Notify owner when link is accessed

---

## 👤 User Experience

### 14. Profile Settings Page
- Change password
- Update email/name
- Profile picture upload

### 15. Storage Quota Alerts
- Warning at 80% usage
- Email notification at 90%
- Auto-cleanup old shares option

### 16. Activity Log
- File upload/download history
- Share creation/access log
- Account activity timeline

### 17. Keyboard Shortcuts
- `Ctrl+U` for upload
- `Del` for delete
- Arrow keys for navigation

---

## 🔐 Security & Admin

### 18. Two-Factor Authentication (2FA)
- TOTP support (Google Authenticator)
- SMS backup codes

### 19. IP Allowlist/Blocklist
- Restrict access by IP range
- Geographic blocking

### 20. Rate Limiting Dashboard
- View API rate limits
- Configure per-user limits

### 21. Audit Logs
- Admin view of all actions
- Export to CSV/JSON

### 22. Invite System
- Admin invitation codes
- Disable public registration
- Email invites with pre-set quotas

---

## 📱 Platform Expansion

### 23. PWA Support
- Install as Progressive Web App
- Offline file list caching
- Push notifications

### 24. Mobile Responsive Improvements
- Touch-friendly file cards
- Swipe actions
- Bottom navigation on mobile

### 25. Desktop Upload App
- System tray uploader
- Screenshot upload shortcut
- Folder sync

### 26. ShareX Integration
- Custom uploader manifest
- One-click screenshot sharing

---

## 🛠 Technical Improvements

### 27. Chunked Uploads
- Resume interrupted uploads
- Progress for large files
- Background upload queue

### 28. CDN Support
- Cloudflare/S3 CDN integration
- Edge caching for downloads

### 29. Thumbnail Generation
- Server-side image thumbnails
- Video preview frames
- PDF first page preview

### 30. Virus Scanning
- ClamAV integration
- Quarantine infected files
- Email notification on detection

---

## 🎨 Customization

### 31. Theme Editor
- Custom color schemes
- Logo upload
- Custom CSS injection

### 32. Landing Page Customization
- Custom HTML blocks
- Feature showcase toggles
- Custom footer

### 33. Email Templates
- Customizable email branding
- Localization support

---

## 📊 Analytics & Monitoring

### 34. Dashboard Stats Widget
- Weekly upload trends
- Storage growth chart
- Active shares count

### 35. Prometheus Metrics
- `/metrics` endpoint
- Grafana dashboard template

### 36. Health Check Endpoint
- `/health` for load balancers
- Database connection status
- Storage availability

---

## Priority Matrix

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Dark Mode Toggle | Low | High | ⭐⭐⭐ |
| Drag & Drop Upload | Low | High | ⭐⭐⭐ |
| File Preview | Medium | High | ⭐⭐⭐ |
| Multi-Select Actions | Medium | High | ⭐⭐⭐ |
| Search & Filter | Medium | High | ⭐⭐⭐ |
| Custom Share URLs | Low | Medium | ⭐⭐ |
| Profile Settings | Medium | Medium | ⭐⭐ |
| 2FA | High | High | ⭐⭐ |
| PWA Support | Medium | Medium | ⭐⭐ |
| Chunked Uploads | High | High | ⭐⭐ |
| Theme Editor | Medium | Low | ⭐ |

---

## Suggested MVP v1.1 Roadmap

### Sprint 1: Quick Wins
- [ ] Dark mode toggle
- [ ] Drag & drop upload
- [ ] Breadcrumb navigation
- [ ] File/folder rename

### Sprint 2: File Management
- [ ] File preview modal
- [ ] Multi-select & bulk actions
- [ ] Search functionality
- [ ] Sort options

### Sprint 3: Sharing Polish
- [ ] Custom share slugs
- [ ] Folder download as ZIP
- [ ] Share analytics

### Sprint 4: User Experience
- [ ] Profile settings page
- [ ] Activity log
- [ ] Keyboard shortcuts
- [ ] Storage alerts

---

## Community Suggestions

> This section is for tracking user-suggested features

1. _No suggestions yet_

---

*Last updated: December 2024*
