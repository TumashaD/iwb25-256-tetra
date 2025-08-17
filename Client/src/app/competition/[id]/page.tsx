'use client';
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('element.ref was removed')) {
    return; // Suppress this specific warning
  }
  originalConsoleError.apply(console, args);
};
console.log('Suppressing React 19 ref warnings');
import {InputAssetProps, StudioEditor,} from '@grapesjs/studio-sdk/react';
import { OrganizerCompetition, OrganizerService } from '@/services/organizerService';
import { useParams } from 'next/navigation';
import type { Asset, Editor, ProjectData } from 'grapesjs';
import { useEffect, useState } from 'react';
import type { Competition } from '@/services/competitionService';
import PageEditor  from '@/components/editor/editor';


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

  const getExportData = (editor:Editor) => {
      console.log('Exporting data...' + editor);
      console.log({ html: editor?.getHtml(), css: editor?.getCss() });
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
  }, [competitionId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {competition && (
        <PageEditor
          getExportData={getExportData}
          uploadAssets={uploadAssets}
          deleteAssets={deleteAssets}
          getAssets={getAssets}
          saveLandingPage={saveLandingPage}
          initialProjectData={JSON.parse(competition.landing_data)}
        />
      )}
    </div>
  );
}
