import { MissionType, FactionName } from "../../../enum";
import { v4 } from 'uuid'

const PoliceMission1:Mission = {
    id: v4(),
    description: 'Cover a patrol shift in the current system.',
    destinationPlanetName: '',
    destinationSystemName: '',
    payment: 4000,
    type: MissionType.PATROL,
    reputationMinimum:0,
    faction: FactionName.POLICE
}

export const FactionMissions:Array<Mission> = [PoliceMission1]