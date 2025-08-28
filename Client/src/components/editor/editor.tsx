import { InputAssetProps, StudioEditor } from "@grapesjs/studio-sdk/react";
import { rteTinyMce, canvasFullSize,flexComponent, accordionComponent } from '@grapesjs/studio-sdk-plugins';
import { OrganizerCompetition } from "@/services/organizerService";
import type {Asset, Editor, ProjectData} from "grapesjs";
import '@grapesjs/studio-sdk/style';

type EditorProps = {
  competition: OrganizerCompetition;
  publishLandingPage: (editor: Editor) => void;
  uploadAssets: (files: File[]) => Promise<InputAssetProps[]>;
  deleteAssets: (assets: Asset[]) => void;
  getAssets: () => Promise<InputAssetProps[]>;
  saveLandingPage: (project: ProjectData) => void;
  initialProjectData: ProjectData;
};

export default function PageEditor({competition,publishLandingPage, uploadAssets, deleteAssets, getAssets, saveLandingPage, initialProjectData }: EditorProps) {
  
  const FallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Competition Landing Page</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 0;
      color: #222;
    }
    .container {
      max-width: 800px;
      margin: 40px auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .banner {
      width: 100%;
      height: 280px;
      object-fit: cover;
      background: #e2e8f0;
      display: block;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: #2563eb;
    }
    .description {
      font-size: 1.2rem;
      margin-bottom: 24px;
      color: #374151;
    }
    .details {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 24px;
    }
    .detail {
      flex: 1 1 200px;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 16px;
      font-size: 1rem;
      color: #334155;
    }
    .cta {
      display: block;
      width: 100%;
      text-align: center;
      margin-top: 32px;
    }
    .cta-btn {
      background: #2563eb;
      color: #fff;
      padding: 16px 32px;
      border: none;
      border-radius: 8px;
      font-size: 1.2rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
    }
    .cta-btn:hover {
      background: #1e40af;
    }
  </style>
</head>
<body>
  <div class="container">
    <img class="banner" src="${competition.banner_url}" alt="Competition Banner" onerror="this.style.display='none'">
    <div class="content">
      <div class="title">${competition.title}</div>
      <div class="description">${competition.description}</div>
      <div class="details">
        <div class="detail"><strong>Category:</strong> ${competition.category}</div>
        <div class="detail"><strong>Status:</strong> ${competition.status}</div>
        <div class="detail"><strong>Start Date:</strong> ${competition.start_date}</div>
        <div class="detail"><strong>End Date:</strong> ${competition.end_date}</div>
      </div>
      <div class="cta">
        <a href="/register" class="cta-btn">Register Now</a>
      </div>
    </div>
  </div>
</body>
</html>`
  return <div className="editor-wrapper h-[100vh]"><StudioEditor
          options={{
        licenseKey: '8fedb98a1263429db09e2ccf5ea68dad71d9b490487a4940b9e6dcd91ca5c14d',
      theme: 'light',
      pages:false,
      layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          { type: 'sidebarLeft' },
          { 
            type: 'canvasSidebarTop', 
            sidebarTop: {
              leftContainer: {
                buttons: ({ items }) => [
                      ...items,
                      {
                        id: 'publishWebsiteProd',
                        type: 'button',
                        icon: '<svg viewBox="0 0 24 24"><path d="m13.13 22.19-1.63-3.83a21.05 21.05 0 0 0 4.4-2.27l-2.77 6.1M5.64 12.5l-3.83-1.63 6.1-2.77a21.05 21.05 0 0 0-2.27 4.4M21.61 2.39S16.66.27 11 5.93a19.82 19.82 0 0 0-4.35 6.71c-.28.75-.09 1.57.46 2.13l2.13 2.12c.55.56 1.37.74 2.12.46A19.1 19.1 0 0 0 18.07 13c5.66-5.66 3.54-10.61 3.54-10.61m-7.07 7.07a2 2 0 0 1 2.83-2.83 2 2 0 0 1-2.83 2.83m-5.66 7.07-1.41-1.41 1.41 1.41M6.24 22l3.64-3.64a3.06 3.06 0 0 1-.97-.45L4.83 22h1.41M2 22h1.41l4.77-4.76-1.42-1.41L2 20.59V22m0-2.83 4.09-4.08c-.21-.3-.36-.62-.45-.97L2 17.76v1.41Z"/></svg>',
                        tooltip: 'Publish website ',
                        onClick: ({ editor }) => publishLandingPage(editor),
                      },
                    ]
              }
            }
          },
          { type: 'sidebarRight' }
        ]
      },
    },
      project: {
        type: 'web',
        default:{
          pages: [
            { name: 'Home', component: FallbackHTML, id: 'home' },
          ]
        }
      },
      
      assets: {
        storageType: 'self',
        // Provide a custom upload handler for assets
        onUpload: async ({ files}) => {
          return await uploadAssets(files);
        },
        // Provide a custom handler for deleting assets
        onDelete: async ({ assets }) => {
          deleteAssets(assets);
        },
        onLoad: async () => {
          return await getAssets();
        },
        
      },
      storage: {
        type: 'self',
        // Provide a custom handler for saving the project data.
        onSave: async ({ project }) => {
          saveLandingPage(project);
        },
        // Provide a custom handler for loading project data.
        onLoad: async () => {
          return { project: initialProjectData };
        },
        autosaveChanges: 50,
        autosaveIntervalMs: 100000
      },
      plugins: [
        rteTinyMce.init({ /* Plugin options: https://app.grapesjs.com/docs-sdk/plugins/rte/tinymce */ }),
        canvasFullSize.init({ /* Plugin options: https://app.grapesjs.com/docs-sdk/plugins/canvas/full-size */ }),
        flexComponent.init({ /* Plugin options: https://app.grapesjs.com/docs-sdk/plugins/components/flex */ }),
        accordionComponent.init({ /* Plugin options: https://app.grapesjs.com/docs-sdk/plugins/components/accordion */ })
      ]
      
      }}
        />;
        </div>
};