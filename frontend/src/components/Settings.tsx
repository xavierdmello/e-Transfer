import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useBalance, useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits, formatEther } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import eTransferAbi from "../../../abi/eTransferAbi";
import tokenAbi from "../../../abi/tokenAbi";
import { nanoid } from "nanoid";
import db from "../firebase.ts";
import { ref, update, set, onValue, get } from "firebase/database";
import { hashEmail, toFixedIfNecessary, numberWithCommas } from "../helperFunctions.ts";
import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  UnorderedList,
  Divider,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Flex,
  Text,
  Spacer,
  Switch,
  Breadcrumb,
} from "@chakra-ui/react";
import { getRedirectResult } from "firebase/auth";
import { isCastable } from "../helperFunctions.ts";
import { ETRANSFER_ADDRESS, TOKEN_ADDRESS } from "../../../config";


type TransferWithId = {
  from: `0x${string}`;
  to: `0x${string}`;
  refundAddress: `0x${string}`;
  amount: bigint;
  id: string;
  index: bigint;
};

type Contact = {
  email: string;
  name: string;
};

function Settings() {
  const toast = useToast();
  const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi();
  const { wallets } = useWallets();
  const { user } = usePrivy();

  const { data: autodepositAddress, isLoading: isAutodepositAddressLoading } = useContractRead({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "autodepositAddress",
    args: [hashEmail(user?.email?.address!)],
    enabled: typeof activeWallet !== "undefined",
    watch: true,
  });

  return (
    <Box backgroundColor={"white"} height={"100%"} borderRadius={"3xl"} overflow={"auto"} padding={"16px"}>
      <Flex direction={"column"} gap={"8px"}>
        <Center>
          <Text fontSize={"16px"} fontWeight={"semibold"}>
            e-Transfer® Settings
          </Text>
        </Center>

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        <Flex flexDirection={"column"}>
          <Flex flexDirection={"row"} alignItems={"center"} justifyContent={"space-between"}>
            <Flex flexDirection={"column"} mr="8px">
              <Text fontWeight={"medium"} fontSize={"lg"}>
                Autodeposit
              </Text>

              <Text fontSize={"sm"} textColor={"gray.500"}>
                Automatically deposit incoming e-Transfers to your wallet
              </Text>
            </Flex>

            <Switch size="lg"></Switch>
          </Flex>
        </Flex>

        <Flex direction={"row"} alignItems={"center"} gap={"12px"} mt={"10px"}>
          <Text whiteSpace={"nowrap"} fontSize={"sm"} fontWeight={"medium"}>
            Deposit To:
          </Text>
          <Select>
            {wallets.map((wallet) => {
              if (user?.wallet?.address === wallet.address) {
                return (
                  <option key={wallet.address} value={wallet.address}>
                    e-Transfer® wallet
                  </option>
                );
              } else {
                return (
                  <option key={wallet.address} value={wallet.address}>
                    {wallet.address}
                  </option>
                );
              }
            })}
          </Select>
        </Flex>

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        <Flex direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Flex direction={"column"}>
            <Text fontWeight={"medium"} fontSize={"lg"}>
              Nickname
            </Text>
            <Text fontSize={"sm"} textColor={"gray.500"}>
              Displayed on outgoing transfers
            </Text>
          </Flex>

          <Input width={"50%"} placeholder="John Doe" />
        </Flex>

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />
      </Flex>
    </Box>
  );
}

export default Settings;
