'use client';
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('element.ref was removed')) {
    return; // Suppress this specific warning
  }
  originalConsoleError.apply(console, args);
};
console.log('Suppressing React 19 ref warnings');
import {InputAssetProps, StudioCommands,ToastVariant} from '@grapesjs/studio-sdk/react';
import { OrganizerCompetition, OrganizerService } from '@/services/organizerService';
import { useParams } from 'next/navigation';
import type { Asset, Editor, ProjectData } from 'grapesjs';
import { useEffect, useState } from 'react';
import type { Competition } from '@/services/competitionService';
import PageEditor  from '@/components/editor/editor';
import { Loader2 } from 'lucide-react';


export default function Competition() {
  const param = useParams();
  const competitionId = param.id ? Number(param.id) : undefined;
  const [competition, setCompetition] = useState<OrganizerCompetition | null>(null);

  const fetchCompetition = async () => {
    if (typeof competitionId === 'number') {
      const competition = await OrganizerService.getCompetition(competitionId);
      console.log('Fetched competition:', competition);
      setCompetition(competition);
      return competition.landing_data;
    } else {
      console.error('Invalid competitionId:', competitionId);
    }
  };

  const publishLandingPage = (editor:Editor) => {
      console.log('Publishing landing page...' + editor);
      const showToast = (id: string) =>
    editor?.runCommand(StudioCommands.toastAdd, {
      id,
      header: 'Your landing page has been published',
      content: 'Your landing page has been published successfully',
      variant: ToastVariant.Info,
    });
      const html = editor.getHtml();
      const css = editor.getCss();
      if (typeof competitionId === 'number' && html && css) {
        OrganizerService.publishLandingPage(competitionId, html, css);
        showToast('publish-landing-page-toast');
      }
  };

  const uploadAssets = async (assets: File[]): Promise<InputAssetProps[]> => {
    if (typeof competitionId === 'number') {
      const result = await OrganizerService.uploadAssets(competitionId, assets);
      console.log('Assets uploaded:', result);
      if (Array.isArray(result)) {
        return result as InputAssetProps[];
      } else {
        return [];
      }
    } else {
      console.error('Invalid competitionId:', competitionId);
      return [];
    }
  };

  const deleteAssets = async (assets: Asset[]) => {
    const assetSrcs: string[] = assets.map(asset => asset.getSrc());
          console.log('Deleting assets:', assetSrcs);
          if (typeof competitionId === 'number') {
            await OrganizerService.deleteAssets(competitionId, assetSrcs);
          } else {
            console.error('Invalid competitionId:', competitionId);
          }
  };

  const getAssets = async () => {
    if (typeof competitionId === 'number') {
            const assets = await OrganizerService.getAssets(competitionId);
            console.log('Loaded assets:', assets);
            // Ensure assets is an array of InputAssetProps or Asset
            if (Array.isArray(assets)) {
              return assets as InputAssetProps[];
            } else {
              return [];
            }
          } else {
            console.error('Invalid competitionId:', competitionId);
            return [];
          }
  };

  const saveLandingPage = async (project:ProjectData) => {
    if (typeof competitionId === 'number') {
            OrganizerService.saveLandingPage(competitionId, project);
          } else {
            console.error('Invalid competitionId:', competitionId);
          }
  };

  useEffect(() => {
    fetchCompetition();
    console.log('CompetitionId:', competitionId);
  }, []);

  if (competition) {
    return (
      <PageEditor
        competition={competition}
        publishLandingPage={publishLandingPage}
        uploadAssets={uploadAssets}
          deleteAssets={deleteAssets}
          getAssets={getAssets}
          saveLandingPage={saveLandingPage}
          initialProjectData={JSON.parse(competition.landing_data)}
        />
  );
} else {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading Competition...</p>
        </div>
      </div>
  )
}
}
