import { SapItemData } from '../sap-api-wrapper/GET-products'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage'
import { productTypesObject } from './productTypeObject'

export function isSapProductIsMissingInfo(sapProduct: SapItemData): boolean {
  let stringOfMissingInfoFields = ''

  if (sapProduct.U_CCF_Ingrediens_EN == null) stringOfMissingInfoFields += 'U_CCF_Ingrediens_EN <BR>'
  if (sapProduct.U_CCF_Ingrediens_DA == null) stringOfMissingInfoFields += 'U_CCF_Ingrediens_DA<BR>'
  if (sapProduct.U_BOYX_Energi == null) stringOfMissingInfoFields += 'U_BOYX_Energi<BR>'
  if (sapProduct.U_BOYX_Energik == null) stringOfMissingInfoFields += 'U_BOYX_Energik<BR>'
  if (sapProduct.U_BOYX_fedt == null) stringOfMissingInfoFields += 'U_BOYX_fedt<BR>'
  if (sapProduct.U_BOYX_fedtsyre == null) stringOfMissingInfoFields += 'U_BOYX_fedtsyre<BR>'
  if (sapProduct.U_BOYX_Kulhydrat == null) stringOfMissingInfoFields += 'U_BOYX_Kulhydrat<BR>'
  if (sapProduct.U_BOYX_sukkerarter == null) stringOfMissingInfoFields += 'U_BOYX_sukkerarter<BR>'
  if (sapProduct.U_BOYX_Protein == null) stringOfMissingInfoFields += 'U_BOYX_Protein<BR>'
  if (sapProduct.U_BOYX_salt == null) stringOfMissingInfoFields += 'U_BOYX_Salt<BR>'
  if (sapProduct.U_BOYX_varedel == null) stringOfMissingInfoFields += 'U_BOYX_varedel<BR>'
  if (productTypesObject[String(sapProduct.ItemsGroupCode)] == null)
    stringOfMissingInfoFields += `ItemsGroupCode is not valid: ${sapProduct.ItemsGroupCode}<BR>`

  if (stringOfMissingInfoFields == '') return false
  sendTeamsMessage(
    'Sap item is missing information',
    'The SAP Product: **' +
      sapProduct.ItemCode +
      '** is missing info in these fields:<BR>' +
      stringOfMissingInfoFields
  )

  return true
}
